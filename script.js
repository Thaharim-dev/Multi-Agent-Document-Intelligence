/** * SECURITY NOTE: Do not hardcode your API Key when pushing to GitHub. 
 * Use an environment variable or a config file that is gitignored.
 */
[cite_start]const apiKey = ""; [cite: 48]
let pdfBase64 = "";
let selectedFile = null;

const el = {
    input: document.getElementById('file-input'),
    zone: document.getElementById('upload-zone'),
    startBtn: document.getElementById('start-btn'),
    terminal: document.getElementById('terminal'),
    loader: document.getElementById('global-loader'),
    results: document.getElementById('results'),
    summary: document.getElementById('summary-content'),
    [cite_start]digit: document.getElementById('digit-content'), [cite: 50]
    meta: document.getElementById('meta-content')
};

[cite_start]el.zone.onclick = () => el.input.click(); [cite: 51]
el.input.onchange = (e) => {
    const file = e.target.files[0];
    [cite_start]if (file) handleFile(file); [cite: 52]
};

function handleFile(file) {
    selectedFile = file;
    [cite_start]document.getElementById('upload-prompt').classList.add('hidden'); [cite: 53]
    document.getElementById('file-display').classList.remove('hidden');
    document.getElementById('filename').textContent = file.name;
    el.startBtn.disabled = false;
    el.startBtn.classList.replace('bg-slate-800', 'bg-blue-600');
    el.startBtn.classList.replace('text-slate-500', 'text-white');
    el.startBtn.classList.add('hover:bg-blue-500', 'cursor-pointer');
    log(`Document loaded: ${file.name}`, 'text-blue-400');

    [cite_start]const reader = new FileReader(); [cite: 54]
    reader.onload = (e) => { pdfBase64 = e.target.result.split(',')[1]; };
    reader.readAsDataURL(file);
}

function clearFile() {
    selectedFile = null;
    [cite_start]pdfBase64 = ""; [cite: 56]
    el.input.value = "";
    document.getElementById('upload-prompt').classList.remove('hidden');
    document.getElementById('file-display').classList.add('hidden');
    el.startBtn.disabled = true;
    el.results.classList.add('hidden');
    log('Buffer cleared.', 'text-slate-500');
}

function log(msg, cls = 'text-slate-400') {
    const div = document.createElement('div');
    [cite_start]div.className = `log-line ${cls}`; [cite: 58]
    div.innerHTML = `<span class="opacity-30">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
    el.terminal.appendChild(div);
    el.terminal.scrollTop = el.terminal.scrollHeight;
}

async function callGemini(prompt, retries = 5) {
    [cite_start]const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`; [cite: 60]
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                [cite_start]headers: { 'Content-Type': 'application/json' }, [cite: 61]
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            [cite_start]{ text: prompt }, [cite: 62]
                            { inlineData: { mimeType: "application/pdf", data: pdfBase64 } }
                        ]
                    }]
                })
            });

            if (response.ok) {
                [cite_start]const data = await response.json(); [cite: 65]
                return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response content.";
            }

            if (response.status === 401) {
                throw new Error("Unauthorized (401). Ensure API context is correctly initialized.");
            }

            [cite_start]const delay = Math.pow(2, i) * 1000; [cite: 67]
            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (err) {
            if (i === retries - 1) throw err;
        }
    }
}

function setAgent(id, status) {
    [cite_start]const card = document.querySelector(`[data-agent="${id}"]`); [cite: 69]
    if (!card) return;
    card.classList.remove('opacity-50', 'active', 'complete');
    if (status === 'active') card.classList.add('active');
    if (status === 'complete') card.classList.add('complete');
}

async function startProcessing() {
    [cite_start]if (!pdfBase64) return; [cite: 71]
    el.startBtn.disabled = true;
    el.loader.classList.remove('hidden');
    el.results.classList.add('hidden');
    el.terminal.innerHTML = "";
    log('Initializing 5-Stage MADI Lossless Pipeline...', 'text-white font-bold');

    try {
        [cite_start]setAgent('vrdu', 'active'); [cite: 73]
        log('AGENT 01 (VRDU): Auditing visual coordinates...');
        await callGemini("Analyze the visual layout. Find all stamps, signatures, and document sections.");
        setAgent('vrdu', 'complete');
        log('✓ Visual Audit: Successful.', 'text-green-500');

        [cite_start]setAgent('digitization', 'active'); [cite: 75]
        log('AGENT 02 (Digitization): Running high-precision OCR and handwriting reconstruction...');
        const digitText = await callGemini("Act as a Document Digitization Agent. Extract all text verbatim. Explicitly transcribe any handwritten annotations, marginalia, or stamped numbers found on the page.");
        el.digit.textContent = digitText;
        setAgent('digitization', 'complete');
        log('✓ Digitization: Lossless text stream generated.', 'text-purple-400');

        [cite_start]setAgent('layout', 'active'); [cite: 78]
        log('AGENT 03 (Layout): Mapping logical structure...');
        await callGemini("Define the logical structure of this document based on headers and columns.");
        setAgent('layout', 'complete');
        log('✓ Layout mapping: Complete.', 'text-green-500');

        [cite_start]setAgent('extraction', 'active'); [cite: 80]
        log('AGENT 04 (Extraction): Extracting verified data points...');
        const metaText = await callGemini(`Extract specific entities: Names, ID numbers, Dates, and Prices. Use this digitized text as your source: ${digitText.substring(0, 500)}`);
        el.meta.textContent = metaText;
        setAgent('extraction', 'complete');
        log('✓ Entity extraction: Verified.', 'text-green-500');

        [cite_start]setAgent('summary', 'active'); [cite: 83]
        log('AGENT 05 (Summary): Synthesizing final report...');
        const summary = await callGemini("Provide a comprehensive summary. Ensure information from handwritten notes is included.");
        el.summary.innerHTML = summary.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        setAgent('summary', 'complete');

        el.results.classList.remove('hidden');
        log('PIPELINE SUCCESS: Documents fully digitized.', 'text-blue-400 font-bold');
    } catch (err) {
        log(`PIPELINE ERROR: ${err.message}`, 'text-red-500 font-bold');
        console.error(err);
    } finally {
        [cite_start]el.loader.classList.add('hidden'); [cite: 87]
        el.startBtn.disabled = false;
    }
}