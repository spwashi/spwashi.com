/**
 * Spw Prompt Utils
 * 
 * Provides affordances to make the interface 'prompt-useful' for LLMs and 
 * engineering leads. Serializes UI state into clean Spw snippets.
 */

export function initSpwPromptUtils() {
    const frames = document.querySelectorAll('.site-frame');
    
    frames.forEach(frame => {
        if (!frame.id) return;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'frame-prompt-copy';
        copyBtn.innerHTML = '<span class="log-op">$</span> copy_context';
        copyBtn.setAttribute('aria-label', `Copy Spw context for ${frame.id}`);
        
        // Positioning: top right of frame
        frame.style.position = 'relative';
        frame.appendChild(copyBtn);

        copyBtn.onclick = (e) => {
            e.stopPropagation();
            const snippet = serializeFrameToSpw(frame);
            navigator.clipboard.writeText(snippet).then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span class="log-op">✓</span> copied';
                copyBtn.classList.add('copy-success');
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copy-success');
                }, 2000);
            });
        };
    });
}

function serializeFrameToSpw(frame) {
    const id = frame.id;
    const op = frame.dataset.spwOperator || '#>';
    const phase = frame.dataset.spwPhase || 'neutral';
    const form = frame.dataset.spwForm || 'brace';
    const role = frame.dataset.spwRole || 'content';
    
    let spw = `${op}${id}\n`;
    spw += `#:layer #!${role}\n`;
    spw += `#:phase .${phase}\n`;
    spw += `#:form .${form}\n\n`;
    
    // Extract a summary of the frame's content for the 'object' body
    const title = frame.querySelector('h1, h2, h3')?.textContent.trim() || 'untitled';
    const description = frame.querySelector('p')?.textContent.trim() || '';
    
    spw += `^"${title}"{\n`;
    spw += `  summary: "${description.slice(0, 100)}..."\n`;
    spw += `  url: "${window.location.origin}${window.location.pathname}#${id}"\n`;
    spw += `}`;
    
    return spw;
}
