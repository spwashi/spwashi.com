import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/spwashi/air/spwashi.com';
const EXCLUDES = new Set(['node_modules', '.git', 'dist', 'dist-vite', '.spw']);

// Mapping of explicit phrase replacements to clean up edge cases or verb-led non-action chips
const CHIP_TRANSFORMS = new Map([
  // Verb-noun on ! -> !verb[target]
  ['!generate_seed', '!generate[seed]'],
  ['!mix_extension', '!mix[extension]'],
  ['!save_note', '!save[note]'],
  ['!email_hello_spwashi_com', '!email[hello_spwashi_com]'],
  ['!open_strip_specimen', '!open[strip_specimen]'],
  ['!generate_seed_markup', '!generate[seed_markup]'],
  ['!prune_stale', '!prune[stale]'],
  ['!start_a_first_quest', '!start[first_quest]'],
  ['!make_a_character_sheet', '!make[character_sheet]'],
  ['!build_a_character_card', '!build[character_card]'],
  ['!reset_paths', '!reset[paths]'],
  ['!reset_authored_defaults', '!reset[authored_defaults]'],
  ['!clear_session_lab_reload', '!clear[session_lab_reload]'],
  ['!clear_draft', '!clear[draft]'],
  ['!reset_curriculum', '!reset[curriculum]'],
  ['!cast_spell', '!cast[spell]'],

  // Nouns on ! -> ~concept or @location or !apply[target]
  ['!spell_ingredients', '~spell_ingredients'],
  ['!portable_seeds', '~portable_seeds'],
  ['!current_direction', '~current_direction'],
  ['!interaction_patterns', '~interaction_patterns'],
  ['!boundaries', '~boundaries'],
  ['!action_seam', '~action_seam'],
  ['!safety', '~safety'],
  ['!services', '@services'],
  ['!tiktok', '>tiktok'],
  ['!project_services', '@project_services'],
  ['!mark_module_complete', '!mark[module_complete]'],
  ['!next_move', '~next_move'],
  ['!text_editing', '~text_editing'],
  ['!author_craft', '~author_craft'],
  ['!play_surfaces', '~play_surfaces'],
  ['!care', '~care'],
  ['!craft', '.craft'],
  ['!files', '~files'],
  ['!discharging_cast', '!discharge[cast]'],
  ['!seed_one_effect', '!seed[one_effect]'],
  ['!actualized_cta', '~actualized_cta'],
  ['!light_mode', '[light_mode]'],
  ['!dark_mode', '[dark_mode]'],
  ['!adaptive_mode', '[adaptive_mode]'],
  ['!copy_this_look_as_query', '!copy[look_as_query]'],
  ['!stage_possibilities', '~stage_possibilities'],
  ['!semantic_spells', '~semantic_spells'],
  ['!choose_quest', '!choose[quest]'],
  ['!synesthesia', '~synesthesia'],
  ['!play', '~play'],
  ['!craft_fragments', '~craft_fragments'],
  ['!prompt_studio', '~prompt_studio'],
  ['!prompt_mining', '~prompt_mining'],
  ['!author_craft_ramp', '~author_craft_ramp'],
  ['!interactive_codeblocks', '~interactive_codeblocks'],

  // = verb-noun -> =verb[target]
  ['=tune_posture', '=tune[posture]'],
  ['=clear_ledger', '=clear[ledger]'],

  // Verb-led phrases on @ (perspective / location) -> @location or !verb[target]
  ['@see_learning_demos', '@learning_demos'],
  ['@see_the_systems_offer', '@systems_offer'],
  ['@shape_a_project', '!shape[project]'],
  ['@start_a_conversation', '!start[conversation]'],
  ['@interpret_input', '!interpret[input]'],
  ['@make_an_ask', '!make[ask]'],
  ['@open_intake', '@intake'],
  ['@sponsor_inquiry', '@sponsor_inquiry'],
  ['@compose_js', '!compose[js]'],
  ['@open_support', '@support'],
  ['@tune_climate', '!tune[climate]'],
  ['@open_services', '@services'],
  ['@start_membership_card', '!start[membership_card]'],
  ['@generate_care_profile', '!generate[care_profile]'],
  ['@start_a_creator_quote', '!start[creator_quote]'],
  ['@email_hello_spwashi_com', '!email[hello_spwashi_com]'],
  ['@email_directly', '!email[directly]'],
  ['@open_systems_work', '@systems_work'],
  ['@open_render_queue', '@render_queue'],
  ['@open_a_heading', '@heading'],
  ['@start_a_custom_quote', '!start[custom_quote]'],
  ['@start_a_systems_quote', '!start[systems_quote]'],
  ['@start_a_quote', '!start[quote]'],
  ['@save_settings', '!save[settings]'],
  ['@save_note', '!save[note]'],
  ['@load_source_into_app', '!load[source_into_app]'],
  ['@see_services', '@services'],
  ['@open_a_render_queue', '@render_queue'],
  ['@start_the_conversation', '!start[conversation]'],

  // Verb-led phrases on ~ (potential / concept) -> ~concept or !verb[target]
  ['~open_palette_grammar', '~palette_grammar'],
  ['~see_the_design_route', '~design_route'],
  ['~set_the_threshold', '!set[threshold]'],
  ['~emit_tone', '!emit[tone]'],
  ['~see_design_circuits', '~design_circuits'],
  ['~explore', '~explore'],
  ['~clear', '!clear'],
  ['~open_card_specimen', '~card_specimen'],
  ['~apply_setup', '!apply[setup]'],
  ['~clear_session_lab_reload', '!clear[session_lab_reload]'],
  ['~compare_components', '~components'],
  ['~open_controls', '~controls'],
  ['~open_svg_experiments', '~svg_experiments'],
  ['~open_settings', '~settings'],
  ['~reset_authored_defaults', '!reset[authored_defaults]'],
  ['~open_css_controls', '~css_controls'],
  ['~reset_css_variables', '!reset[css_variables]'],
  ['~open_handoff', '~handoff'],
  ['~open_css_experiments', '~css_experiments'],
  ['~open_renderers', '~renderers'],
  ['~open_svg_handoff', '~svg_handoff'],
  ['~compare_against_css', '~css_comparison'],
  ['~inspect_current_runtime', '~runtime'],
  ['~reset', '!reset'],
  ['~inspect', '~inspect'],
  ['~read_palettes', '~palettes'],
  ['~open_rule_bench', '~rule_bench'],
  ['~compare_svg', '~svg_comparison'],
  ['~open_website_guide', '~website_guide'],
  ['~open_website_design', '~website_design'],
  ['~open_pretext', '~pretext'],
  ['~open_asset_review', '~asset_review'],
  ['~open_architecture', '~architecture'],
  ['~open_palettes', '~palettes'],
  ['~open_glossary', '~glossary'],
  ['~open_css_lab', '~css_lab'],
  ['~open_svg_lab', '~svg_lab'],
  ['~open_rpg_wednesday', '~rpg_wednesday'],
  ['~inspect_compose_js', '~compose_js'],
  ['~reset_preview', '!reset[preview]'],
  ['~apply_matte_clear_globally', '!apply[matte_clear_globally]'],
  ['~reset_to_authored', '!reset[to_authored]'],
  ['~open_full_settings', '~settings'],
  ['~open_bundle_docs', '~bundle_docs'],
  ['~nourish_latest', '~nourish_latest'],
  ['~see_the_system', '~system'],
  ['~commission', '!commission'],
  ['~cast', '!cast'],
  ['~cast_register', '~cast_register'],
  ['~see_the_ecosystem', '~ecosystem'],
  ['~join_a_group', '!join[group]'],
  ['~read_the_software_case', '~software_case'],
  ['~read_runtime_note', '~runtime_note'],
  ['~open_recipes', '~recipes'],
  ['~read_the_software_thesis', '~software_thesis'],
  ['~inspect_this_site_as_proof', '~site_proof'],
  ['~publish', '!publish'],
  ['~prepare_for_readers', '!prepare[for_readers]'],
  ['~make_reading_easier', '!make[reading_easier]'],
  ['~reduce_friction', '!reduce[friction]'],
  ['~make_it_expressive', '!make[it_expressive]'],
  ['~inspect_the_system', '~system_inspection'],
  ['~clear_query', '!clear[query]'],
  ['~clear_all', '!clear[all]'],
  ['~interpret_a_note', '!interpret[note]'],
  ['~try_fragments', '~fragments'],
  ['~shape_motifs', '!shape[motifs]'],
  ['~see_the_systems_path', '~systems_path'],
  ['~see_play_surfaces', '~play_surfaces'],
  ['~see_the_campaign_loop', '~campaign_loop'],
  ['~anchor_equations', '#>anchor_equations'],
  ['~inspect_the_website_guide', '~website_guide'],
  ['~return', '~return'],
  ['~compare_probe', '?probe'],
  ['~open_the_town_library', '~town_library'],
  ['~open_session_logs', '~session_logs'],
  ['~open_research', '~research'],
  ['~open_play', '~play'],
  ['~open_mise_en_place', '~mise_en_place'],

  // Verb-led phrases on #> (frame) -> #>frame
  ['#>contact', '#>contact'],
  ['#>address', '#>address'],
  ['#>open_frame_specimen', '#>frame_specimen'],
  ['#>inspect', '#>inspect'],
  ['#>inspect_contract', '#>inspect_contract'],
  ['#>read_token', '#>read_token'],
  ['#>tune_variable', '!tune[variable]'],
  ['#>open_the_full_design_catalog', '#>design_catalog'],
  ['#>open_settings', '#>settings'],
  ['#>open_curriculum', '#>curriculum'],
  ['#>open_membership', '#>membership'],
  ['#>see_the_map', '#>site_map'],
  ['#>open_configurator', '#>configurator'],
  ['#>compare_pricing', '#>pricing'],
  ['#>open_services_card', '#>services_card'],
  ['#>read_the_site_guide', '#>site_guide'],
  ['#>shape_a_fragment', '!shape[fragment]'],
  ['#>anchor_equations', '#>equations'],
  ['#>anchor_vocabulary', '#>vocabulary'],
  ['#>render_pipeline', '#>render_pipeline'],

  // Verb-led phrases on ^ (integration) -> ^artifact or !verb[target]
  ['^plant', '^plant'],
  ['^return_to_cask_and_the_library', '^cask_and_library'],
  ['^return_to_town_library', '^town_library'],
  ['^publish', '!publish'],
  ['^inspect_capture_ready_card', '^capture_ready_card'],
  ['^open_midjourney_bench', '^midjourney_bench'],
  ['^compose_css', '^css'],
  ['^open_folio_archive', '^folio_archive'],
  ['^plant_mix', '^plant_mix'],
  ['^make_a_proof_card', '!make[proof_card]'],
  ['^make_a_card', '!make[card]'],
  ['^make_an_artifact', '!make[artifact]'],
  ['^open_cards', '^cards'],
  ['^plant_a_seed', '!plant[seed]'],
  ['^build_a_services_card', '!build[services_card]'],
  ['^open_proof_cards', '^proof_cards'],
  ['^build_the_card', '!build[card]'],
  ['^inspect_ast', '!inspect[ast]'],
  ['^compose_arc', '!compose[arc]'],

  // Verb-led phrases on $ (substrate) -> $substrate or !verb[target]
  ['$fund', '$fund'],
  ['$support', '$support'],
  ['$inspect_current_work', '$current_work'],
  ['$inspect_current_substrate', '$current_substrate'],
  ['$open_now', '$now'],
  ['$save_checkpoint', '!save[checkpoint]'],
  ['$inspect_substrate', '$substrate'],

  // Verb-led phrases on * (value) -> *value or !verb[target]
  ['*materialize', '*materialize'],
  ['*browse_folios', '*folios'],
  ['*explore_routes', '*routes'],
  ['*open_a_render_queue', '*render_queue'],
  ['*publish_a_field_note', '!publish[field_note]'],

  // Verb-led phrases on % (measure)
  ['%compare_memory_cost', '%memory_cost'],
]);

function getAllHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getAllHtmlFiles(full));
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

function encodeEntities(s) {
  return s.replace(/>/g, '&gt;').replace(/</g, '&lt;');
}

function runRefinement() {
  const files = getAllHtmlFiles(ROOT);
  let totalReplaced = 0;
  const replacedLog = [];

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    for (const [oldChipText, newChipText] of CHIP_TRANSFORMS.entries()) {
      const encodedOld = encodeEntities(oldChipText);
      const encodedNew = encodeEntities(newChipText);

      const re = new RegExp(
        `(<(?:a|span|button|div)\\b[^>]*?\\bclass=["'][^"']*\\boperator-chip\\b[^"']*["'][^>]*>)(?:${oldChipText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${encodedOld.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(<\\/(?:a|span|button|div)>)`,
        'g'
      );

      if (re.test(content)) {
        content = content.replace(re, (m, openTag, closeTag) => {
          totalReplaced++;
          changed = true;
          replacedLog.push(`  ${path.relative(ROOT, file)}: "${oldChipText}" → "${newChipText}"`);
          return `${openTag}${encodedNew}${closeTag}`;
        });
      }
    }

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
    }
  }

  console.log(`Refinement complete! Total chips updated: ${totalReplaced}`);
  if (replacedLog.length > 0) {
    console.log(`Sample refinements (first 25):`);
    replacedLog.slice(0, 25).forEach(l => console.log(l));
  }
}

runRefinement();
