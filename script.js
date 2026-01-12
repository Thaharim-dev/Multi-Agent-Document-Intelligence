    // CRITICAL: Replace the empty string below with your Google AI Studio API key
        // Get one at: https://aistudio.google.com/app/apikey
        const apiKey = ""; 

        const model = "gemini-2.5-flash-preview-09-2025";
        let selectedFile = null;

        // UI Handlers
        const fileInput = document.getElementById('file-input');
        const uploadZone = document.getElementById('upload-zone');
        const startBtn = document.getElementById('start-btn');
        const terminal = document.getElementById('terminal');
        const statusEl = document.getElementById('status');

        uploadZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                selectedFile = file;
                document.getElementById('upload-prompt').classList.add('hidden');
                document.getElementById('file-display').classList.remove('hidden');
                document.getElementById('filename').textContent = file.name;
                startBtn.disabled = false;
                startBtn.className = "w-full py-4 rounded-xl font-bold text-lg transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20";
                log(`File staged: ${file.name}`, 'text-blue-400');
            }
        };

        function clearFile() {
            selectedFile = null;
            fileInput.value = '';
            document.getElementById('upload-prompt').classList.remove('hidden');
            document.getElementById('file-display').classList.add('hidden');
            startBtn.disabled = true;
            startBtn.className = "w-full py-4 rounded-xl font-bold text-lg transition-all bg-white/5 text-white/20 cursor-not-allowed";
        }

        function log(msg, color = 'text-white/60') {
            const div = document.createElement('div');
            div.className = `${color} leading-relaxed`;
            div.innerHTML = `<span class="opacity-20 mr-2">${new Date().toLocaleTimeString()}</span> ${msg}`;
            terminal.appendChild(div);
            terminal.scrollTop = terminal.scrollHeight;
        }

        async function callGemini(prompt, pdfData = null) {
            // Check if API Key is missing for local dev
            if (!apiKey || apiKey === "") {
                throw new Error("Missing API Key. Please add your key to the 'apiKey' variable in the source code.");
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            const contents = [{
                parts: [
                    { text: prompt },
                    ...(pdfData ? [{ inlineData: { mimeType: "application/pdf", data: pdfData } }] : [])
                ]
            }];

            const maxRetries = 5;
            let lastError = null;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents })
                    });

                    const responseText = await response.text();
                    
                    if (!response.ok) {
                        let errorMsg = `HTTP ${response.status}`;
                        try {
                            const errorJson = JSON.parse(responseText);
                            errorMsg = errorJson.error?.message || errorMsg;
                        } catch(e) {}
                        throw new Error(errorMsg);
                    }

                    const data = JSON.parse(responseText);
                    const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    
                    if (output === undefined) throw new Error("API returned empty content candidate");
                    return output;

                } catch (err) {
                    lastError = err;
                    if (i < maxRetries - 1) {
                        const delay = Math.pow(2, i) * 1000;
                        await new Promise(r => setTimeout(r, delay));
                    }
                }
            }
            throw lastError;
        }

        async function startProcessing() {
            if (!selectedFile) return;

            // Reset UI
            startBtn.disabled = true;
            document.getElementById('results').classList.add('hidden');
            document.querySelectorAll('.agent-card').forEach(c => c.className = 'agent-card rounded-xl p-4 flex items-center');
            terminal.innerHTML = '';
            
            log('Initializing multi-agent protocol...', 'text-blue-400 font-bold');
            statusEl.textContent = 'Active';

            try {
                const reader = new FileReader();
                const base64Promise = new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(selectedFile);
                });
                const pdfBase64 = await base64Promise;

                const pipeline = [
                    { id: 'vrdu', label: 'VRDU Agent', prompt: 'Analyze the document visual layout, identifying headers, footers, tables, and paragraphs.' },
                    { id: 'layout', label: 'Layout Analysis', prompt: 'Structure the following visual data into a logical reading sequence.' },
                    { id: 'extraction', label: 'Extraction', prompt: 'Extract all semantic data from this document based on the following structure.' },
                    { id: 'digitization', label: 'Digitization', prompt: 'Normalize all extracted data into a cohesive markdown-style format.' },
                    { id: 'summary', label: 'Summarization', prompt: 'Provide a clear, executive-level summary of the provided text.' }
                ];

                let context = "";
                const results = {};

                for (const stage of pipeline) {
                    const card = document.querySelector(`[data-agent="${stage.id}"]`);
                    card.classList.add('active');
                    statusEl.textContent = `Running: ${stage.label}`;
                    log(`Invoking ${stage.label}...`);

                    const fullPrompt = stage.id === 'vrdu' ? stage.prompt : `${stage.prompt}\n\nPrevious Analysis:\n${context}`;
                    const usePdf = ['vrdu', 'extraction'].includes(stage.id);
                    
                    results[stage.id] = await callGemini(fullPrompt, usePdf ? pdfBase64 : null);
                    context = results[stage.id];

                    card.classList.replace('active', 'complete');
                    log(`✓ ${stage.label} successful`, 'text-green-400');
                }

                log('Running Final Verification...', 'text-purple-400');
                const [evaluation, bias] = await Promise.all([
                    callGemini(`Evaluate the following extraction for completeness and accuracy: ${results.digitization}`),
                    callGemini(`Check for potential bias or missed critical information in this summary: ${results.summary}`)
                ]);

                document.getElementById('summary-content').textContent = results.summary;
                document.getElementById('eval-content').textContent = evaluation;
                document.getElementById('bias-content').textContent = bias;
                document.getElementById('results').classList.remove('hidden');
                
                log('Pipeline execution complete.', 'text-green-400 font-bold');
                statusEl.textContent = 'Standby';
                startBtn.disabled = false;

            } catch (err) {
                log(`CRITICAL ERROR: ${err.message}`, 'text-red-400 font-bold');
                statusEl.textContent = 'Failed';
                startBtn.disabled = false;
                document.querySelector('.agent-card.active')?.classList.add('border-red-500', 'bg-red-500/10');
            }
        }
