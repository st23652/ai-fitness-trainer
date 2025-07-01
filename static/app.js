document.addEventListener('DOMContentLoaded', () => {
    // --- Icon Initialization ---
    lucide.createIcons();

    // --- DOM Element Selection ---
    const form = document.getElementById('workoutForm');
    const generateBtn = document.getElementById('generateBtn');
    const initialMessage = document.getElementById('initial-message');
    const spinner = document.getElementById('spinner');
    const planSection = document.getElementById('planSection');
    const planContent = document.getElementById('plan-content');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    // Modal elements
    const instructionModal = document.getElementById('instructionModal');
    const modalTitle = document.getElementById('modal-title');
    const modalInstructions = document.getElementById('modal-instructions');
    const modalCloseBtn = document.getElementById('modalCloseBtn');


    // --- Dark Mode Logic ---
    const sunIcon = darkModeToggle.querySelector('[data-lucide="sun"]');
    const moonIcon = darkModeToggle.querySelector('[data-lucide="moon"]');

    const setDarkMode = (isDark) => {
        document.body.classList.toggle('dark-mode', isDark);
        sunIcon.style.display = isDark ? 'none' : 'block';
        moonIcon.style.display = isDark ? 'block' : 'none';
        localStorage.setItem('darkMode', isDark);
    };

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('darkMode');
    setDarkMode(savedTheme !== null ? savedTheme === 'true' : prefersDark);

    darkModeToggle.addEventListener('click', () => {
        setDarkMode(!document.body.classList.contains('dark-mode'));
    });

    // --- State Management Functions ---
    const showState = (state) => {
        [initialMessage, spinner, planSection, errorMessage].forEach(el => el.style.display = 'none');
        if (state) state.style.display = 'flex';
    };

    // --- Form Submission Logic ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showState(spinner);
        generateBtn.disabled = true;
        generateBtn.querySelector('span').textContent = 'Generating...';

        const formData = new FormData(form);
        const data = {
            age: formData.get('age'),
            weight: formData.get('weight'),
            location: formData.get('location'),
            duration: formData.get('duration'),
            workout_hours: formData.get('workout_hours'),
            goals: formData.getAll('goals'),
            focus: formData.get('focus'),
        };

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            // Robust error handling
            if (!response.ok) {
                let errorMsg = `HTTP error! Status: ${response.status}`;
                try {
                    // Try to parse a JSON error response from the server
                    const errData = await response.json();
                    errorMsg = errData.error || errorMsg;
                } catch (jsonError) {
                    // If the response isn't JSON, use the raw text
                    errorMsg = await response.text();
                }
                throw new Error(errorMsg);
            }

            const result = await response.json();
            // Clean the response to remove potential markdown code block specifiers
            const cleanedPlan = result.plan.replace(/```html|```/g, '').trim();
            planContent.innerHTML = cleanedPlan;
            showState(planSection);

        } catch (error) {
            errorText.textContent = error.message;
            showState(errorMessage);
        } finally {
            generateBtn.disabled = false;
            generateBtn.querySelector('span').textContent = 'Generate Plan';
        }
    });

    // --- Modal Logic ---
    planContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('exercise-name')) {
            const exerciseName = e.target.textContent;
            const instructions = e.target.dataset.instruction;
            
            modalTitle.textContent = `${exerciseName} - Instructions`;
            modalInstructions.textContent = instructions;
            instructionModal.style.display = 'flex';
        }
    });

    const closeModal = () => {
        instructionModal.style.display = 'none';
    };

    modalCloseBtn.addEventListener('click', closeModal);
    instructionModal.addEventListener('click', (e) => {
        // Close if the overlay is clicked, but not the content inside it
        if (e.target === instructionModal) {
            closeModal();
        }
    });


    // --- Action Button Logic ---
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(planContent.innerText).then(() => {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = `<i data-lucide="check"></i>`;
            lucide.createIcons();
            setTimeout(() => { copyBtn.innerHTML = originalIcon; lucide.createIcons(); }, 2000);
        });
    });

    downloadBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const planElement = document.getElementById('plan-content');
        
        html2canvas(planElement, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const imgWidth = pdfWidth - 20;
            const imgHeight = imgWidth / ratio;
            
            let heightLeft = imgHeight;
            let position = 10;
            
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - 20);
            }
            pdf.save('FitForge-Plan.pdf');
        });
    });
    
    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
});
