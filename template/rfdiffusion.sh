#script to run rfdiffusion design

#load modules
module load anaconda/3
module load singularity/3.7.1

export DIFFUSION_SIF="/storage/group/u1o/alphafold/vvm5242/rfdiffusion.sif"
export DIFFUSION_LOG_FILE="${LOGDIR}/diffusion_job.log"

# Generate SLURM script for diffusion job
DIFFUSION_SLURM_SCRIPT="${INPUT_DIR}/diffusion_job.slurm"
cat <<EOF > "${DIFFUSION_SLURM_SCRIPT}"
#!/bin/bash
#SBATCH --nodes=1
#SBATCH --ntasks=8
#SBATCH --mem=60GB
#SBATCH --gpus=1
#SBATCH --time=10:00:00
#SBATCH --partition=sla-prio
#SBATCH --account=${ACCOUNT}
#SBATCH --output=${DIFFUSION_LOG_FILE}

singularity exec --nv \\
  --bind "${INPUT_DIR}":/inputs \\
  --bind "${STRUCT}":/outputs \\
  --bind "${DIFFUSION_MODELS}":/app/RFdiffusion/models \\
  --bind "${DIFFUSION_SCHEDULES}":/schedules \\
  --bind "/tmp" \\
  ${DIFFUSION_SIF} \\
  python3.9 /app/RFdiffusion/scripts/run_inference.py \\
    inference.model_directory_path=/app/RFdiffusion/models \\
    inference.input_pdb=/inputs/$(basename "${PDB_FILE}") \\
    inference.output_prefix=/outputs/denovo \\
    inference.schedule_directory_path=/schedules \\
    inference.num_designs=${NUM_DESIGNS} \\
    inference.timesteps=${TIMESTEPS} \\
    ${DIFFUSION_PARAMS}
EOF

# Submit job and get ID
DIFFUSION_JOB_ID=$(sbatch "${DIFFUSION_SLURM_SCRIPT}" | awk '{print $4}')
export DIFFUSION_JOB_ID

# Add mode-specific parameters
case "<%= context.design_mode %>" in
  "binder")
    export DIFFUSION_PARAMS+=" binder.protein_binder=True "
    ;;
  "scaffold")
    export DIFFUSION_PARAMS+=" scaffoldguided.scaffoldguided=True "
    ;;
  "partial") 
    export DIFFUSION_PARAMS+=" partial_diffusion.partial_T=<%= context.timesteps.to_i/2 %> "
    ;;
  "symmetric")
    export DIFFUSION_PARAMS+=" symmetry.symmetry_type=<%= context.symmetry_type %> "
    ;;
esac

# Add potentials if enabled
<% if context.use_potentials == "1" %>
export DIFFUSION_PARAMS+=" potentials.guiding_potentials=True "
<% end %>

