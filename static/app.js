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
            workout_hours: formData.get('workout_hours'), // Added workout hours
            goals: formData.getAll('goals'),
            focus: formData.get('focus'),
        };

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            planContent.innerHTML = result.plan;
            showState(planSection);

        } catch (error) {
            errorText.textContent = error.message;
            showState(errorMessage);
        } finally {
            generateBtn.disabled = false;
            generateBtn.querySelector('span').textContent = 'Generate Plan';
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
            const imgWidth = pdfWidth - 20; // with margin
            const imgHeight = imgWidth / ratio;
            
            let heightLeft = imgHeight;
            let position = 10; // top margin
            
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10; // top margin on new page
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
