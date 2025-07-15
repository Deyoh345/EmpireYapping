const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

async function createInventoryImage(player) {
    const cols = 5;
    const rows = 4;
    const boxSize = 128;
    const gap = 20;
    const padding = 40;
    const textHeight = 30;
    const titleHeight = 50;

    const canvasWidth = padding * 2 + cols * boxSize + (cols - 1) * gap;
    const canvasHeight = padding * 2 + titleHeight + rows * (boxSize + textHeight) + (rows - 1) * gap;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Latar belakang
    const bgPath = path.join(__dirname, '..', 'assets', 'backgrounds', 'inventory_background.png');
    if (fs.existsSync(bgPath)) {
        const background = await loadImage(bgPath);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#34373b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Judul
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 5;
    ctx.fillText(`${player.username}'s Inventory`, canvas.width / 2, padding + 10);
    ctx.shadowBlur = 0; // Reset shadow

    const inventoryItems = Object.values(player.inventory);

    for (let i = 0; i < rows * cols; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;

        const x = padding + col * (boxSize + gap);
        const y = padding + titleHeight + row * (boxSize + textHeight + gap);

        // Gambar kotak
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, boxSize, boxSize, [10]);
        ctx.fill();
        ctx.stroke();

        const item = inventoryItems[i];
        if (item) {
            // Gambar item
            try {
                const itemImagePath = path.join(__dirname, '..', 'assets', 'items', item.image);
                if (fs.existsSync(itemImagePath)) {
                    const itemImage = await loadImage(itemImagePath);
                    ctx.drawImage(itemImage, x + 14, y + 14, boxSize - 28, boxSize - 28);
                }
            } catch (e) {
                console.error(`Tidak bisa memuat gambar untuk item: ${item.name}`, e);
            }

            // Tulis nama item
            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, x + boxSize / 2, y + boxSize + 20, boxSize);

            // Tulis jumlah item
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'right';
            ctx.strokeText(item.quantity, x + boxSize - 10, y + boxSize - 5);
            ctx.fillText(item.quantity, x + boxSize - 10, y + boxSize - 5);
        }
    }

    return canvas.toBuffer('image/png');
}

module.exports = { createInventoryImage };