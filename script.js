// File: script.js (Perbarui fungsi downloadVideo)

// Variabel Global
let currentPlatform = 'tiktok'; // Platform default

// Fungsi Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    switchPlatform('tiktok');
});

// Fungsi Ganti Platform (Tetap Sama)
function switchPlatform(platform) {
    currentPlatform = platform;
    const tiktokButton = document.getElementById('select-tiktok');
    const instagramButton = document.getElementById('select-instagram');
    const tiktokDownloader = document.getElementById('tiktok-downloader');
    const instagramDownloader = document.getElementById('instagram-downloader');
    const resultDiv = document.getElementById('result');
    const loadingSpinner = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');

    resultDiv.innerHTML = '';
    resultDiv.style.display = 'none';
    loadingSpinner.style.display = 'none';
    loadingText.style.display = 'none';

    if (platform === 'tiktok') {
        tiktokButton.classList.add('active');
        instagramButton.classList.remove('active');
        tiktokDownloader.classList.add('active');
        instagramDownloader.classList.remove('active');
    } else if (platform === 'instagram') {
        instagramButton.classList.add('active');
        tiktokButton.classList.remove('active');
        instagramDownloader.classList.add('active');
        tiktokDownloader.classList.remove('active');
    }
}

// Fungsi Tempel (Tetap Sama)
async function pasteFromClipboard(inputId) {
    const inputField = document.getElementById(inputId);
    if (!inputField) return;

    try {
        const text = await navigator.clipboard.readText();
        inputField.value = text;
        console.log(`Teks berhasil ditempel ke #${inputId}.`);
    } catch (err) {
        console.error('Gagal membaca clipboard: ', err);
        inputField.placeholder = "Gagal menempel. Coba manual.";
        setTimeout(() => {
             inputField.placeholder = inputId === 'tiktokUrl' ? 'Tempel tautan video TikTok di sini' : 'Tempel tautan video/Reels Instagram';
         }, 2000);
    }
}

// ==================================================
// --- FUNGSI DOWNLOADVIDEO YANG DIPERBARUI ---
// ==================================================
async function downloadVideo(platform) {
    const inputId = platform + 'Url';
    const videoUrlInput = document.getElementById(inputId);
    const videoUrl = videoUrlInput.value.trim();
    const resultDiv = document.getElementById('result');
    const loadingSpinner = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');

    // Reset UI
    resultDiv.innerHTML = '';
    resultDiv.style.display = 'none';
    loadingSpinner.style.display = 'block';
    loadingText.style.display = 'block';

    if (!videoUrl) {
        loadingSpinner.style.display = 'none';
        loadingText.style.display = 'none';
        resultDiv.innerHTML = '<p class="error">Silakan masukkan URL terlebih dahulu.</p>';
        resultDiv.style.display = 'block';
        return;
    }

    let apiUrl = '';
    let platformName = '';
    let responseData = null;
    let success = false;
    let errorMessage = `Gagal mendapatkan video. Pastikan URL valid atau coba lagi nanti.`; // Default error

    // Tentukan API dan nama platform
    if (platform === 'tiktok') {
        apiUrl = `https://api.im-rerezz.xyz/api/dl/tiktok?url=${encodeURIComponent(videoUrl)}`;
        platformName = 'TikTok';
    } else if (platform === 'instagram') {
        apiUrl = `https://api.im-rerezz.xyz/api/dl/instagram?url=${encodeURIComponent(videoUrl)}`;
        platformName = 'Instagram';
    } else {
        loadingSpinner.style.display = 'none';
        loadingText.style.display = 'none';
        resultDiv.innerHTML = '<p class="error">Platform tidak dikenal.</p>';
        resultDiv.style.display = 'block';
        return;
    }

    console.log(`[${platformName}] Mencoba mengunduh dari: ${videoUrl}`);
    console.log(`[${platformName}] Menggunakan API: ${apiUrl}`);

    // ==========================================
    // --- Logika Download dengan Fallback (Khusus TikTok) ---
    // ==========================================
    if (platform === 'tiktok') {
        // 1. Coba Request Langsung ke API TikTok
        try {
            console.log(`[${platformName}] Mencoba API Langsung...`);
            const response = await axios.get(apiUrl, { timeout: 15000 }); // Timeout 15 detik
            responseData = response.data;
            console.log(`[${platformName}] Respon Langsung:`, responseData);

            if (responseData.status && responseData.data?.videoUrl) {
                success = true;
                 console.log(`[${platformName}] Sukses dengan API Langsung.`);
            } else {
                 // API merespon tapi data tidak valid, JANGAN coba proxy, langsung error
                 errorMessage = `API ${platformName} merespon, tapi data tidak valid: ${responseData.message || 'Format tidak dikenal.'}`;
                 console.log(`[${platformName}] Respon langsung tidak valid.`);
                 // success tetap false
            }
        } catch (directError) {
            // JIKA REQUEST LANGSUNG GAGAL (Timeout, Network Error, CORS), coba via Proxy
            console.error(`[${platformName}] Error dengan API Langsung: ${directError.message}. Mencoba via proxy...`);
            errorMessage = `Gagal menghubungi API ${platformName} secara langsung. Mencoba via proxy...`;

            // 2. Coba via Proxy AllOrigins
            try {
                const directApiUrlEncoded = encodeURIComponent(apiUrl); // URL API asli yang di-encode
                const proxyUrl = `https://api.allorigins.win/get?url=${directApiUrlEncoded}`;
                console.log(`[${platformName}] Mencoba via Proxy: ${proxyUrl}`);

                const proxyResponse = await axios.get(proxyUrl, { timeout: 25000 }); // Timeout lebih lama untuk proxy

                if (proxyResponse.data && proxyResponse.data.contents) {
                    const contents = proxyResponse.data.contents;
                    // Parsing JSON dari 'contents'
                    responseData = JSON.parse(contents);
                    console.log(`[${platformName}] Respon via Proxy (Parsed):`, responseData);

                    // Validasi data dari hasil proxy (sama seperti validasi langsung)
                    if (responseData.status && responseData.data?.videoUrl) {
                        success = true;
                        console.log(`[${platformName}] Sukses via Proxy.`);
                        errorMessage = ''; // Hapus pesan error jika proxy sukses
                    } else {
                        // Proxy berhasil, tapi data API di dalamnya tidak valid
                        errorMessage = `Proxy berhasil, tapi data API ${platformName} tidak valid: ${responseData.message || 'Format tidak dikenal.'}`;
                        console.log(`[${platformName}] ${errorMessage}`);
                         // success tetap false
                    }
                } else {
                    // Struktur response proxy tidak sesuai
                    throw new Error("Proxy AllOrigins tidak mengembalikan field 'contents'.");
                }
            } catch (proxyError) {
                 // Jika Proxy JUGA GAGAL
                console.error(`[${platformName}] Error dengan Proxy AllOrigins:`, proxyError.message);
                errorMessage = `Gagal menghubungi API ${platformName} secara langsung (${directError.message}) maupun via proxy (${proxyError.message}).`;
                // success tetap false
            }
        }
    // ==========================================
    // --- Logika Download Langsung (Untuk Instagram atau platform lain) ---
    // ==========================================
    } else { // Untuk Instagram atau platform lain (tanpa fallback proxy saat ini)
         try {
            console.log(`[${platformName}] Mencoba API Langsung...`);
            const response = await axios.get(apiUrl, { timeout: 20000 });
            responseData = response.data;
            console.log(`[${platformName}] Respon Langsung:`, responseData);

             // Validasi Instagram (contoh)
             if (platform === 'instagram') {
                 if (responseData.status && responseData.data && responseData.data.length > 0 && responseData.data[0].url) {
                     success = true;
                 } else {
                     errorMessage = `API ${platformName} merespon, tapi data tidak valid: ${responseData.message || responseData.msg || 'Format tidak dikenal.'}`;
                 }
             }
             // Tambahkan validasi platform lain di sini jika perlu
             // else if (platform === '...') { ... }

        } catch (error) {
             console.error(`[${platformName}] Error dengan API Langsung:`, error);
             if (error.code === 'ECONNABORTED') {
                 errorMessage = `API ${platformName} tidak merespon (timeout). Coba lagi nanti.`;
             } else if (error.response) {
                 errorMessage = `API ${platformName} mengembalikan error ${error.response.status}. Coba URL lain.`;
             } else {
                 errorMessage = `Gagal menghubungi API ${platformName}. Periksa koneksi atau coba lagi nanti.`;
             }
             // success tetap false
         }
    }


    // ==========================================
    // --- Tampilkan Hasil atau Error ---
    // ==========================================
    loadingSpinner.style.display = 'none';
    loadingText.style.display = 'none';
    resultDiv.style.display = 'block'; // Tampilkan area hasil

    if (success && responseData) {
        // Panggil fungsi displayResults yang sudah ada
        displayResults(platform, responseData.data);
    } else {
        resultDiv.innerHTML = `<p class="error">${errorMessage}</p>`;
    }
}

// Fungsi untuk Menampilkan Hasil (Tetap Sama)
function displayResults(platform, data) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    let videoElement = '';
    let downloadButtonsHTML = '';

    if (platform === 'tiktok' && data) { // Pastikan data ada
        const videoUrl = data.videoUrl;
        const musicUrl = data.musicUrl;
        const coverUrl = data.thumbnail;

        if (videoUrl) {
            videoElement = `
                <video id="smallVideo" controls poster="${coverUrl || ''}" title="Klik untuk memperbesar">
                    <source src="${videoUrl}" type="video/mp4">
                    Browser Anda tidak mendukung tag video.
                </video>`;
             downloadButtonsHTML += `
                <a href="${videoUrl}" download="tiktok_video_snapdonz.mp4" class="download-btn">
                    <i class="fas fa-video"></i> Unduh Video
                </a>`;
        }
        if (musicUrl) {
            downloadButtonsHTML += `
                <a href="${musicUrl}" download="tiktok_music_snapdonz.mp3" class="download-btn">
                    <i class="fas fa-music"></i> Unduh Musik
                </a>`;
        }

    } else if (platform === 'instagram' && Array.isArray(data) && data.length > 0) {
        const videoUrl = data[0].url;
        const thumbnailUrl = data[0].thumbnail;

        if(videoUrl) {
            videoElement = `
                <video id="smallVideo" controls poster="${thumbnailUrl || ''}" title="Klik untuk memperbesar">
                    <source src="${videoUrl}" type="${data[0].type === 'video' ? 'video/mp4' : 'image/jpeg'}">
                    Browser Anda tidak mendukung tag video.
                </video>`;
            downloadButtonsHTML += `
                <a href="${videoUrl}" download="instagram_snapdonz.${data[0].type === 'video' ? 'mp4' : 'jpg'}" class="download-btn">
                    <i class="fas fa-${data[0].type === 'video' ? 'video' : 'image'}"></i> Unduh Media
                </a>`;
        }
    }

    if (videoElement || downloadButtonsHTML) {
        resultDiv.innerHTML = videoElement + `<div class="download-buttons">${downloadButtonsHTML}</div>`;
        const smallVideo = document.getElementById('smallVideo');
        const videoSource = smallVideo?.querySelector('source')?.src;
        if (smallVideo && videoSource) {
            smallVideo.onclick = () => openPopup(videoSource);
        }
    } else {
         resultDiv.innerHTML = `<p class="error">Tidak ada media yang bisa ditampilkan dari URL ini.</p>`;
    }
}


// Fungsi Buka/Tutup Popup (Tetap Sama)
function openPopup(videoLink) {
    const popup = document.getElementById('videoPopup');
    const popupVideo = document.getElementById('popupVideo');
    if(!videoLink) return;
    popupVideo.src = videoLink;
    popup.style.display = 'flex';
     try { popupVideo.play(); } catch(e) { console.warn("Autoplay popup diblokir."); }
}
function closePopup() {
    const popup = document.getElementById('videoPopup');
    const popupVideo = document.getElementById('popupVideo');
    popupVideo.pause();
    popupVideo.src = '';
    popup.style.display = 'none';
}
