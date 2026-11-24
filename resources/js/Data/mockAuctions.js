/**
 * Static Marketplace Auction Data for MyBidder.ID Landing Page
 * Provides 13 themed marketplace shelves (rows), each containing 16 cards (max 16 per row)
 * to support initial 3 rows + "Show More" (+5 rows per click).
 */

export const MARKETPLACE_CATEGORIES = [
    { id: 'all', name: 'Semua Kategori' },
    { id: 'elektronik', name: 'Elektronik & Gadget' },
    { id: 'jam-tangan', name: 'Jam Tangan & Antik' },
    { id: 'sneakers', name: 'Sneakers & Fashion' },
    { id: 'otomotif', name: 'Otomotif & Klasik' },
    { id: 'kamera', name: 'Kamera & Lensa' },
    { id: 'komputer', name: 'Laptop & PC Gaming' },
    { id: 'seni', name: 'Seni & Koleksi Rare' },
    { id: 'musik', name: 'Alat Musik Vintage' },
];

const PRODUCT_TEMPLATES = {
    elektronik: [
        {
            title: 'Sony PlayStation 5 Pro 30th Anniversary Limited',
            shortDescription: 'BNIB segel resmi, nomor seri kolektor 0421/12300 lengkap DualSense Edge.',
            image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=500&q=80',
            openBid: 15000000,
            increment: 250000,
        },
        {
            title: 'iPhone 16 Pro Max 1TB Desert Titanium Resmi iBox',
            shortDescription: 'Unit baru open box pengecekan, garansi aktif 12 bulan, fullset ori.',
            image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=500&q=80',
            openBid: 18500000,
            increment: 200000,
        },
        {
            title: 'Bang & Olufsen Beosound A9 Brass Edition',
            shortDescription: 'Speaker ikonik kelas audiophile, suara jernih, kaki kayu oak asli.',
            image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=500&q=80',
            openBid: 22000000,
            increment: 500000,
        },
        {
            title: 'Nintendo Switch OLED Zelda Tears of Kingdom Ed.',
            shortDescription: 'Edisi spesial kolektor mulus 99%, bonus dock custom & hardcase.',
            image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=500&q=80',
            openBid: 3800000,
            increment: 100000,
        },
    ],
    'jam-tangan': [
        {
            title: 'Rolex Submariner Date Vintage 1982 Ref 16800',
            shortDescription: 'Kondisi mint terawat, lengkap box original & sertifikat paper resmi.',
            image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=80',
            openBid: 85000000,
            increment: 1000000,
        },
        {
            title: 'Omega Speedmaster Moonwatch Professional 1969',
            shortDescription: 'Mesin manual wind cal. 861 berjalan akurat, patina dial alami.',
            image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=500&q=80',
            openBid: 54000000,
            increment: 750000,
        },
        {
            title: 'Seiko Prospex Alpinist Limited Blue Dial Japan',
            shortDescription: 'Rilisan khusus pasar Jepang (JDM), kaca safir mulus, strap kulit.',
            image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=500&q=80',
            openBid: 8500000,
            increment: 150000,
        },
        {
            title: 'Tag Heuer Carrera Chronograph Calibre 16',
            shortDescription: 'Sport luxury watch, bezel keramik anti gores, garansi internasional.',
            image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=500&q=80',
            openBid: 24000000,
            increment: 500000,
        },
    ],
    sneakers: [
        {
            title: 'Nike Air Jordan 1 High OG Chicago 1985 Collector',
            shortDescription: 'Size 9.5US, kulit original berpatina klasik, terawat di climate box.',
            image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=500&q=80',
            openBid: 25000000,
            increment: 500000,
        },
        {
            title: 'Adidas Yeezy Boost 350 V2 Zebra Deadstock',
            shortDescription: 'Size 42 EU, brand new with tag, verified authentic double box.',
            image: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=500&q=80',
            openBid: 3200000,
            increment: 100000,
        },
        {
            title: 'New Balance 990v6 Made in USA Grey Special',
            shortDescription: 'Suede premium, kenyamanan maksimal, box lengkap sertifikat USA.',
            image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=500&q=80',
            openBid: 2900000,
            increment: 100000,
        },
        {
            title: 'Nike Dunk Low Panda Special Box Collaboration',
            shortDescription: 'Edisi terbatas kolaborasi desainer Tokyo, kondisi 100% DS.',
            image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=500&q=80',
            openBid: 4500000,
            increment: 150000,
        },
    ],
    otomotif: [
        {
            title: 'Piaggio Vespa Super 150 VBC 1966 Restorasi Ori',
            shortDescription: 'Surat akur BPKB/STNK hidup, cat Grigio Italia, mesin halus sehat.',
            image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=500&q=80',
            openBid: 32000000,
            increment: 1000000,
        },
        {
            title: 'Helm Arai RX-7X Nakano Shuriken Gold Rare',
            shortDescription: 'Size L, mulus tanpa baret, visor iridium ori + pinlock terpasang.',
            image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=500&q=80',
            openBid: 9500000,
            increment: 250000,
        },
        {
            title: 'Honda Astrea Grand Bulus 1991 Full Original',
            shortDescription: 'KM rendah simpanan kolektor, part 95% orisinal bawaan pabrik.',
            image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=500&q=80',
            openBid: 18000000,
            increment: 500000,
        },
        {
            title: 'Velg BBS RS Forged 16 Inch Made in Germany',
            shortDescription: 'Original 3-piece forged, PCD 4x100, repaint gold lips polish.',
            image: 'https://images.unsplash.com/photo-1611821064430-0d40291d0f0b?auto=format&fit=crop&w=500&q=80',
            openBid: 16500000,
            increment: 500000,
        },
    ],
    kamera: [
        {
            title: 'Leica M6 TTL Classic Black Chrome + Summicron 35mm',
            shortDescription: 'Kamera analog legendaris, lightmeter akurat, optik bersih bebas jamur.',
            image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80',
            openBid: 48000000,
            increment: 1000000,
        },
        {
            title: 'Sony Alpha A7RV Body Only Shutter Count 1.200',
            shortDescription: 'Garansi resmi Sony Indonesia panjang, mulus like new fullbox.',
            image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=500&q=80',
            openBid: 39000000,
            increment: 500000,
        },
        {
            title: 'Fujifilm X100VI Silver Limited 90th Anniversary',
            shortDescription: 'Baru tersegel, termasuk strap kulit khusus dan lens hood asli.',
            image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=500&q=80',
            openBid: 26500000,
            increment: 500000,
        },
        {
            title: 'Hasselblad 500C/M Carl Zeiss Planar 80mm f/2.8',
            shortDescription: 'Medium format klasik impian fotografer studio, fungsi mekanik normal.',
            image: 'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=500&q=80',
            openBid: 31000000,
            increment: 500000,
        },
    ],
    komputer: [
        {
            title: 'MacBook Pro 16" M3 Max 64GB RAM 2TB Space Black',
            shortDescription: 'Battery health 100%, cycle count 8, AppleCare+ aktif sampai 2027.',
            image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80',
            openBid: 42000000,
            increment: 500000,
        },
        {
            title: 'Custom Mechanical Keyboard Kohaku 65% SingaKBD',
            shortDescription: 'Rare gasket mount custom keyboard, switch Cherry MX Black hyperglide.',
            image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=500&q=80',
            openBid: 12000000,
            increment: 250000,
        },
        {
            title: 'NVIDIA RTX 4090 Founders Edition Collector Box',
            shortDescription: 'Performa monster rendering & AI, suhu dingin terawat bebas mining.',
            image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=500&q=80',
            openBid: 24500000,
            increment: 500000,
        },
        {
            title: 'Monitor Apple Studio Display Nano-Texture 5K',
            shortDescription: 'Layar 27 inci 5K Retina tajam luar biasa, stand tilt-adjustable.',
            image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80',
            openBid: 19000000,
            increment: 300000,
        },
    ],
    seni: [
        {
            title: 'Lukisan Kanvas "Harmoni Nusantara" 120x90cm',
            shortDescription: 'Karya cat minyak autentik dilengkapi sertifikat keaslian galeri.',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=500&q=80',
            openBid: 14000000,
            increment: 300000,
        },
        {
            title: 'Bearbrick 1000% KAWS Dissected Companion Brown',
            shortDescription: 'Authentic Medicom Toy, hidden tag NFC valid, box original mulus.',
            image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=500&q=80',
            openBid: 19500000,
            increment: 500000,
        },
        {
            title: 'Koin Emas Kuno Era Majapahit & VOC Sertifikat NGC',
            shortDescription: 'Grade MS63 terverifikasi lembaga numismatik internasional, super langka.',
            image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=500&q=80',
            openBid: 11000000,
            increment: 250000,
        },
        {
            title: 'Patung Perunggu Klasik Ubud Bali Handmade 1978',
            shortDescription: 'Detail pahatan tinggi warisan seniman Bali tahun 1978, berat 6.5 kg.',
            image: 'https://images.unsplash.com/photo-1544413660-299165566b1d?auto=format&fit=crop&w=500&q=80',
            openBid: 7500000,
            increment: 200000,
        },
    ],
    musik: [
        {
            title: 'Fender Stratocaster American Vintage 1962 Reissue',
            shortDescription: 'Sunburst nitro lacquer, tone blues khas vintage, hardcase tweed ori.',
            image: 'https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=500&q=80',
            openBid: 27000000,
            increment: 500000,
        },
        {
            title: 'Gibson Les Paul Standard 50s Heritage Cherry',
            shortDescription: 'Flame maple top AAA grade, pickup Burstbucker, suara tebal berkarakter.',
            image: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=500&q=80',
            openBid: 33000000,
            increment: 500000,
        },
        {
            title: 'Turntable Technics SL-1200MK7 Direct Drive DJ',
            shortDescription: 'Standar industri vinyl audiophile & DJ dunia, mulus jarang pakai.',
            image: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?auto=format&fit=crop&w=500&q=80',
            openBid: 13500000,
            increment: 250000,
        },
        {
            title: 'Piringan Hitam Vinyl The Beatles Abbey Road 1969 UK',
            shortDescription: 'First pressing UK Parlophone original, kondisi sleeve & disc VG+.',
            image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=500&q=80',
            openBid: 4200000,
            increment: 100000,
        },
    ],
};

const ROW_THEMES = [
    { id: 'row-1', title: '🔥 Lelang Paling Panas (Trending Live Now)', subtitle: 'Bid aktif masuk setiap detik — jangan sampai terlampaui!', category: 'all', accent: 'red' },
    { id: 'row-2', title: '⌚ Jam Tangan Mewah & Barang Antik', subtitle: 'Horologi kelas kolektor dengan sertifikat keaslian', category: 'jam-tangan', accent: 'amber' },
    { id: 'row-3', title: '🎮 Elektronik & Konsol Edisi Terbatas', subtitle: 'Gadget langka dan limited edition bergaransi resmi', category: 'elektronik', accent: 'blue' },
    { id: 'row-4', title: '👟 Sneakers & Streetwear Collector', subtitle: 'Sneakers deadstock & rilisan kolaborasi ikonik', category: 'sneakers', accent: 'emerald' },
    { id: 'row-5', title: '🛵 Otomotif Klasik & Part Orisinal', subtitle: 'Motor antik terawat dan aksesoris balap langka', category: 'otomotif', accent: 'orange' },
    { id: 'row-6', title: '📷 Kamera Vintage & Lensa Pro', subtitle: 'Analog klasik hingga mirrorless flagship shutter rendah', category: 'kamera', accent: 'indigo' },
    { id: 'row-7', title: '💻 Laptop Sultan & PC Custom High-End', subtitle: 'Performa ekstrem untuk kreator, dev, dan gamer', category: 'komputer', accent: 'cyan' },
    { id: 'row-8', title: '🎨 Karya Seni, Lukisan & Mainan Koleksi', subtitle: 'Karya seniman maestro dan designer toys berlisensi', category: 'seni', accent: 'purple' },
    { id: 'row-9', title: '🎸 Alat Musik Vintage & Vinyl Langka', subtitle: 'Gitar klasik Amerika dan piringan hitam first pressing', category: 'musik', accent: 'rose' },
    { id: 'row-10', title: '⚡ Flash Auction: Berakhir Dalam Hitungan Jam!', subtitle: 'Kesempatan terakhir sebelum palu lelang diketok', category: 'all', accent: 'red' },
    { id: 'row-11', title: '💎 Koleksi Pilihan Kurator MyBidder.ID', subtitle: 'Dikurasi langsung oleh tim ahli barang langka', category: 'jam-tangan', accent: 'amber' },
    { id: 'row-12', title: '🏆 Open Bid Mulai Dari 2 Jutaan', subtitle: 'Lelang terjangkau dengan peluang menang tinggi', category: 'sneakers', accent: 'emerald' },
    { id: 'row-13', title: '🌟 Rekomendasi Eksklusif Untuk Kolektor', subtitle: 'Item langka yang paling banyak di-watchlist minggu ini', category: 'elektronik', accent: 'blue' },
];

const BIDDER_NAMES = ['B***a', 'R***i', 'A***d', 'S***i', 'D***o', 'K***n', 'N***a', 'F***r', 'T***y', 'W***u'];

/**
 * Generates 13 rows, each containing 16 realistic auction items (max 16 cards per row).
 */
export function generateStaticMarketplaceRows() {
    const allCategories = Object.keys(PRODUCT_TEMPLATES);
    const now = Date.now();
    let globalId = 1;

    return ROW_THEMES.map((rowTheme, rowIdx) => {
        const items = [];

        for (let i = 0; i < 16; i++) {
            const catKey = rowTheme.category === 'all'
                ? allCategories[(rowIdx + i) % allCategories.length]
                : rowTheme.category;

            const templates = PRODUCT_TEMPLATES[catKey];
            const tpl = templates[(i + rowIdx) % templates.length];

            const priceVariation = (i % 5) * tpl.increment * 2;
            const openBid = tpl.openBid + priceVariation;
            const initialSteps = ((i + rowIdx) % 6) + 1;
            const highestBid = openBid + (initialSteps * tpl.increment);

            // Stagger remaining times between 25 minutes and 48 hours
            const secondsOffset = (1500 + ((rowIdx * 7 + i * 13) % 120) * 900);
            const endTimeMs = now + secondsOffset * 1000;

            items.push({
                id: `item-${globalId++}`,
                rowId: rowTheme.id,
                title: `${tpl.title}${i >= 4 ? ` #Batch-${i + 1}` : ''}`,
                shortDescription: tpl.shortDescription,
                category: catKey,
                categoryLabel: MARKETPLACE_CATEGORIES.find((c) => c.id === catKey)?.name || 'Koleksi',
                image: tpl.image,
                openBid,
                highestBid,
                previousBid: highestBid,
                minIncrement: tpl.increment,
                lastDelta: 0,
                bidCount: 3 + ((i * 3 + rowIdx) % 24),
                lastBidder: BIDDER_NAMES[(i + rowIdx) % BIDDER_NAMES.length],
                endTimeMs,
                lastUpdatedTick: 0,
            });
        }

        return {
            ...rowTheme,
            items,
        };
    });
}

export function getRandomMaskedBidder() {
    return BIDDER_NAMES[Math.floor(Math.random() * BIDDER_NAMES.length)];
}
