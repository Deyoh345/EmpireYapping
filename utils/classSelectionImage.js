const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Fungsi bantuan untuk menggambar teks yang bisa wrap (pindah baris)
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

async function createClassSelectionImage() {
    const width = 900;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Latar belakang
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#4a2c2a'); // Coklat gelap
    gradient.addColorStop(1, '#2a1c1a'); // Coklat lebih gelap
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Judul Utama
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = '#FFD700'; // Emas
    ctx.textAlign = 'center';
    ctx.fillText('PILIH JALAN HIDUPMU', width / 2, 70);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.strokeText('PILIH JALAN HIDUPMU', width / 2, 70);

    // Kotak Pilihan Kelas
    const classes = [
        { name: 'Gladiator', desc: 'Petarung arena yang tangguh. Kekuatan fisik adalah segalanya.', color: '#c0392b', image: 'gladiator.png' },
        { name: 'Mercenary', desc: 'Prajurit bayaran serba bisa. Seimbang dalam serangan dan pertahanan.', color: '#7f8c8d', image: 'mercenary.png' },
        { name: 'Merchant', desc: 'Pedagang cerdik yang ulung dalam negosiasi. Memulai dengan kekayaan.', color: '#27ae60', image: 'merchant.png' },
        { name: 'Magus', desc: 'Pengguna sihir misterius. Mengandalkan kecerdasan untuk mengalahkan musuh.', color: '#8e44ad', image: 'magus.png' },
        { name: 'Assassin', desc: 'Pembunuh senyap yang bergerak dalam bayangan. Cepat dan mematikan.', color: '#34495e', image: 'assassin.png' },
        { name: 'Ranger', desc: 'Pemanah ahli dan penjelajah hutan. Mahir dalam serangan jarak jauh.', color: '#2ecc71', image: 'ranger.png' },
        { name: 'Paladin', desc: 'Ksatria suci yang dibalut baju zirah. Memiliki pertahanan yang sangat kuat.', color: '#f1c40f', image: 'paladin.png' },
        { name: 'Berserker', desc: 'Pejuang buas yang mengamuk dalam pertempuran. Kekuatan besar dengan pertahanan rendah.', color: '#e67e22', image: 'berserker.png' }
    ];

    // Tata letak grid 2x4
    const cols = 4;
    const boxWidth = 180;
    const boxHeight = 320;
    const gapX = (width - (cols * boxWidth)) / (cols + 1);
    const gapY = 40;
    const startY = 120;

    for (let i = 0; i < classes.length; i++) {
        const cls = classes[i];
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = gapX + col * (boxWidth + gapX);
        const y = startY + row * (boxHeight + gapY);

        // Latar belakang kotak
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = cls.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x, y, boxWidth, boxHeight, [20]);
        ctx.fill();
        ctx.stroke();

        // Gambar karakter kelas
        try {
            // Mengubah path agar gambar diambil langsung dari folder 'assets'
            const imagePath = path.join(__dirname, '..', 'assets', 'classes', cls.image);
            const image = await loadImage(imagePath);
            ctx.drawImage(image, x + 25, y + 20, boxWidth - 50, 130);
        } catch (err) {
            console.error(`Gagal memuat gambar untuk kelas ${cls.name}: ${err.message}`);
        }

        // Judul Kelas
        ctx.font = 'bold 26px sans-serif';
        ctx.fillStyle = cls.color;
        ctx.textAlign = 'center';
        ctx.fillText(cls.name, x + boxWidth / 2, y + 185);

        // Deskripsi
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#ecf0f1'; // Abu-abu terang
        ctx.textAlign = 'center';
        drawWrappedText(ctx, cls.desc, x + boxWidth / 2, y + 220, boxWidth - 30, 20);
    }

    return canvas.toBuffer('image/png');
}

module.exports = { createClassSelectionImage };