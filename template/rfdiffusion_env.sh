#!/bin/bash

export PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python

export RUN_DIR="${WORKINGDIR}/pp${CREATED_AT}"
export STATUS_FILE="status.json"

export INPUT_DIR="${RUN_DIR}/input"
export STRUCT="${RUN_DIR}/structure"
export LOGDIR="${RUN_DIR}/logs"
export CPU_LOG_FILE="${LOGDIR}/cpu_job.log"
export GPU_LOG_FILE="${LOGDIR}/gpu_job.log"

export DIFFUSION_BASE="/storage/group/u1o/alphafold/vvm5242"
export DIFFUSION_MODELS="${DIFFUSION_BASE}/RFdiffusion/models"
export DIFFUSION_SCHEDULES="${DIFFUSION_BASE}/RFdiffusion/schedules"
export DIFFUSION_SIF="${DIFFUSION_BASE}/rfdiffusion.sif"
export DIFFUSION_PARAMS="contigmap.contigs=[100-100] ppi.hotspot_res='' scaffoldguided.scaffoldguided=False"

# Add design mode to status reporting
export STATUS_UPDATE="Design Mode: <%= context.design_mode.titleize %> | Designs: ${NUM_DESIGNS} | Steps: ${TIMESTEPS}"
