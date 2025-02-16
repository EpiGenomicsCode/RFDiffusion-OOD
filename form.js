$(document).ready(function() {
  const form = $('#new_batch_connect_session_context');
  const errorContainer = $('<div class="alert alert-danger" style="display: none;"></div>');
  const modeOptionsContainer = $('<div id="mode-specific-options"></div>');
  
  // Insert the container after the design mode select
  $('#batch_connect_session_context_design_mode').closest('.form-group').after(modeOptionsContainer);
  form.prepend(errorContainer);

  function displayError(message) {
    errorContainer.text(message).show();
  }

  function hideError() {
    errorContainer.hide();
  }

  function updateModeSpecificOptions() {
    const designMode = $('#batch_connect_session_context_design_mode').val();
    modeOptionsContainer.empty();

    const pdbGroup = $('#batch_connect_session_context_pdb_structure').closest('.form-group');
    designMode === 'unconditional' ? pdbGroup.hide() : pdbGroup.show();

    switch(designMode) {
      case 'binder':
        addBinderOptions();
        break;
      case 'scaffold':
        addScaffoldOptions();
        break;
      case 'partial':
        addPartialDiffusionOptions();
        break;
      case 'symmetric':
        addSymmetricOptions();
        break;
    }
  }

  function createFormGroup(options) {
    const group = $('<div class="form-group"></div>');
    const label = $('<label class="control-label"></label>').text(options.label);
    const input = $(`<input class="form-control" name="batch_connect_session_context[${options.name}]">`).attr(options.attrs || {});
    const help = $('<small class="form-text text-muted"></small>').text(options.help);
    
    return group.append(label).append(input).append(help);
  }

  function addBinderOptions() {
    modeOptionsContainer.append([
      createFormGroup({
        name: 'target_chain',
        label: 'Target Chain',
        help: 'Chain ID of the target protein',
        attrs: {
          type: 'text',
          required: true
        }
      }),
      createFormGroup({
        name: 'pocket_range',
        label: 'Binding Pocket Range',
        help: 'Residue ranges defining the binding pocket (e.g., A10-A30,A45-A60)',
        attrs: {
          type: 'text',
          placeholder: 'e.g., A10-A30,A45-A60'
        }
      }),
      createFormGroup({
        name: 'hotspots',
        label: 'Hotspot Residues',
        help: 'Key residues for interaction (e.g., A15,A17,A23)',
        attrs: {
          type: 'text',
          placeholder: 'e.g., A15,A17,A23'
        }
      })
    ]);
  }

  function addScaffoldOptions() {
    modeOptionsContainer.append([
      createFormGroup({
        name: 'motif_chain',
        label: 'Motif Chain',
        help: 'Chain ID containing the motif',
        attrs: {
          type: 'text',
          required: true
        }
      }),
      createFormGroup({
        name: 'extensions',
        label: 'Terminal Extensions',
        help: 'Number of residues to extend (0-50)',
        attrs: {
          type: 'number',
          min: 0,
          max: 50,
          value: 0
        }
      })
    ]);
  }

  function addPartialDiffusionOptions() {
    modeOptionsContainer.append([
      createFormGroup({
        name: 'input_chain',
        label: 'Input Chain',
        help: 'Chain ID to partially diffuse',
        attrs: {
          type: 'text',
          required: true
        }
      }),
      createFormGroup({
        name: 'fixed_regions',
        label: 'Fixed Regions',
        help: 'Regions to keep fixed during diffusion (e.g., 1-10,20-30)',
        attrs: {
          type: 'text',
          placeholder: 'e.g., 1-10,20-30'
        }
      })
    ]);
  }

  function addSymmetricOptions() {
    const symmetryGroup = $('<div class="form-group"></div>');
    const symmetryLabel = $('<label class="control-label">Symmetry Type</label>');
    const symmetrySelect = $('<select class="form-control" name="batch_connect_session_context[symmetry_type]" required></select>')
      .append('<option value="cyclic">Cyclic (Cn)</option>')
      .append('<option value="dihedral">Dihedral (Dn)</option>');
    const symmetryHelp = $('<small class="form-text text-muted">Type of symmetry to enforce</small>');

    modeOptionsContainer.append(
      symmetryGroup.append(symmetryLabel).append(symmetrySelect).append(symmetryHelp),
      createFormGroup({
        name: 'sym_units',
        label: 'Number of Units',
        help: 'Number of symmetric units (2-12)',
        attrs: {
          type: 'number',
          min: 2,
          max: 12,
          value: 2,
          required: true
        }
      })
    );
  }

  function updatePotentialOptions() {
    const usePotentials = $('#batch_connect_session_context_use_potentials').is(':checked');
    const designMode = $('#batch_connect_session_context_design_mode').val();
    const potentialFields = $('#batch_connect_session_context_potential_weights').closest('.form-group');
    
    if (usePotentials && (designMode === 'symmetric' || designMode === 'scaffold')) {
      potentialFields.show();
    } else {
      potentialFields.hide();
    }
  }

  function updateFoldConditioningOptions() {
    const useFoldConditioning = $('#batch_connect_session_context_fold_conditioning').is(':checked');
    const conditioningFields = $('#batch_connect_session_context_secondary_structure, #batch_connect_session_context_block_adjacency')
      .closest('.form-group');
    
    useFoldConditioning ? conditioningFields.show() : conditioningFields.hide();
  }

  function validatePartialDiffusion() {
    const designMode = $('#batch_connect_session_context_design_mode').val();
    if (designMode === 'partial') {
      const partialT = parseInt($('#batch_connect_session_context_partial_diffusion_partial_T').val());
      const timesteps = parseInt($('#batch_connect_session_context_timesteps').val());
      
      if (partialT > timesteps) {
        displayError('Partial diffusion steps must be less than or equal to total timesteps');
        return false;
      }
    }
    return true;
  }

  // Event handlers
  $('#batch_connect_session_context_design_mode').change(function() {
    updateModeSpecificOptions();
  });

  form.on('submit', function(event) {
    hideError();
    const designMode = $('#batch_connect_session_context_design_mode').val();
    
    // Validate PDB file for non-unconditional modes
    if (designMode !== 'unconditional') {
      const pdbFile = $('#batch_connect_session_context_pdb_structure').val();
      if (!pdbFile) {
        event.preventDefault();
        displayError('PDB structure is required for ' + designMode + ' mode');
        return;
      }
    }

    // New validations
    if (!validatePartialDiffusion()) {
      event.preventDefault();
      return;
    }

    // Validate fold conditioning files if enabled
    if ($('#batch_connect_session_context_fold_conditioning').is(':checked')) {
      const ssFile = $('#batch_connect_session_context_secondary_structure').val();
      const adjFile = $('#batch_connect_session_context_block_adjacency').val();
      if (!ssFile || !adjFile) {
        event.preventDefault();
        displayError('Both secondary structure and block adjacency files are required when fold conditioning is enabled');
        return;
      }
    }

    // Validate mode-specific required fields
    const requiredFields = modeOptionsContainer.find('[required]');
    let valid = true;

    requiredFields.each(function() {
      if (!$(this).val()) {
        valid = false;
        displayError('Please fill in all required fields');
        return false;
      }
    });

    if (!valid) {
      event.preventDefault();
    }
  });

  // Add new event handlers
  $('#batch_connect_session_context_use_potentials').change(updatePotentialOptions);
  $('#batch_connect_session_context_fold_conditioning').change(updateFoldConditioningOptions);

  // Initialize form
  updateModeSpecificOptions();
  updatePotentialOptions();
  updateFoldConditioningOptions();
  
  // Auto-enable active site model for small motifs
  $('#batch_connect_session_context_pdb_structure').change(function() {
    const file = this.files[0];
    if (file) {
      // This is a placeholder - you'd need to actually parse the PDB file
      // to determine the number of residues
      const numResidues = 15; // Example value
      if (numResidues < 15) {
        $('#batch_connect_session_context_specialized_model').val('active_site');
      }
    }
  });

  $(document).on('change', '#design_mode', function() {
    const mode = $(this).val();
    // Toggle PDB requirement
    $('#pdb_structure').closest('.form-group').toggle(mode !== 'unconditional');
    // Toggle potentials availability
    $('#use_potentials').closest('.form-group').toggle(['symmetric','scaffold','binder'].includes(mode));
  });
});
