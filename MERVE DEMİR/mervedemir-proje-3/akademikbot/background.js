chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DOWNLOAD_CSV') {
        const data = message.data || [];
        const hamUniAdi = message.uniAdi || 'Karatay_YOK_Kadro';

        // Dosya ismindeki özel karakterleri ve boşlukları temizle/değiştir
        let dosyaAdi = hamUniAdi
            .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
            .replace(/ü/g, 'u').replace(/Ü/g, 'U')
            .replace(/ş/g, 's').replace(/Ş/g, 'S')
            .replace(/ı/g, 'i').replace(/İ/g, 'I')
            .replace(/ö/g, 'o').replace(/Ö/g, 'O')
            .replace(/ç/g, 'c').replace(/Ç/g, 'C')
            .replace(/[^a-zA-Z0-9]/g, '_') // Harf ve rakam dışındakileri alt tire yap
            .replace(/_+/g, '_') // Yan yana gelen alt tireleri teke düşür
            .replace(/_$/, ''); // Sondaki alt tireyi sil

        dosyaAdi = `${dosyaAdi}.xls`;

        const satirlar = ['Üniversite\tUnvan\tIsim\tFakulte\tBolum\tE-Posta'];

        data.forEach(p => {
            const esc = s => String(s || '-').replace(/\t/g, ' ');
            satirlar.push(
                `${esc(p.universite)}\t${esc(p.unvan)}\t${esc(p.isim)}\t${esc(p.fakulte)}\t${esc(p.bolum)}\t${esc(p.email)}`
            );
        });

        const tsvIcerik = satirlar.join('\r\n');
        const bom = new Uint8Array([0xFF, 0xFE]);
        
        // UTF-16 LE encode
        const chars = tsvIcerik;
        const buf = new ArrayBuffer(chars.length * 2);
        const view = new DataView(buf);
        for (let i = 0; i < chars.length; i++) {
            view.setUint16(i * 2, chars.charCodeAt(i), true);
        }

        const icerikBytes = new Uint8Array(buf);
        const birlesik = new Uint8Array(bom.length + icerikBytes.length);
        birlesik.set(bom, 0);
        birlesik.set(icerikBytes, bom.length);

        // Service Worker'da URL.createObjectURL desteklenmediği için veriyi Base64 Data URI'ye çeviriyoruz
        let binaryString = '';
        for (let i = 0; i < birlesik.byteLength; i++) {
            binaryString += String.fromCharCode(birlesik[i]);
        }
        const base64Veri = btoa(binaryString);
        const dataUrl = 'data:application/vnd.ms-excel;base64,' + base64Veri;

        chrome.downloads.download({
            url: dataUrl,
            filename: dosyaAdi,
            saveAs: false
        });
    }
});