import { useState } from 'react';

const SECTIONS = [
  {
    id: 'ask',
    title: 'Questions to ask',
    emoji: '💬',
    items: [
      { label: 'What is this shoe for?', tip: 'Nail the use-case first — running, walking, workplace, or cross-training. This sets the entire category filter for the fitting. A road runner and a nurse have completely different needs.' },
      { label: 'Any specific aches or pains?', tip: 'This is your entry into the Insert Finder. Plantar fasciitis, Achilles tightness, ball-of-foot pain, shin splints, and knee pain all have direct insert pairings. Note the specific location.' },
      { label: 'What shoe are you currently using for this?', tip: 'The old shoe tells you stack height preference, brand loyalty, and often the real problem ("I love the Ghost but my knee started hurting at mile 8"). Ask how it feels at mile 1 vs. mile 6.' },
      { label: 'What size are you typically in?', tip: 'Ask before the scan. The scan result often surprises people — having their old size as a reference makes it easier to explain why you are recommending sizing up a half size.' },
      { label: 'Do you have diabetes? If so, any neuropathy?', tip: 'Neuropathy = no pain signal. An ill-fitting shoe can cause blisters and ulcers without the customer knowing. Route to the Neuropathy/Diabetes category and a DMP (memory foam) insert.' },
      { label: 'Is anyone else being fit today?', tip: 'Sets expectation for the appointment length. Also opens up family cross-sell: if their partner runs, ask about their foot health too.' },
      { label: 'Has a doctor recommended a specific shoe or insert?', tip: 'Respect the script — find the closest match on the floor. If there is a specific brand or model, look it up in Browse. Note the recommendation in the shoe specs field.' },
      { label: 'What do you like and dislike about your current shoe?', tip: '"Too stiff" → softer cushion or more flexible upper. "Falls apart at the heel" → better heel counter or wider heel cup. "Hurts my toes" → wider toe box or sizing up. This question shortcuts 20 minutes of trial and error.' },
      { label: 'Any color restrictions? (work uniform, preference)', tip: 'Filter out colors early so you don\'t fall in love with a shoe they cannot wear at work. Some jobs have strict all-black, all-white, or non-reflective requirements.' },
      { label: 'What are your goals for this shoe?', tip: 'Training for a first 5K vs. a marathon vs. walking a warehouse shift = completely different shoes. This maps directly to use-case and stack height priority.' },
      { label: 'How often do you run / what are you training for?', tip: 'High mileage (50+ mi/wk) → more durable upper, more cushion to manage fatigue. Race-day vs. training day may call for two different shoes — open up that conversation.' },
      { label: 'Sock preference — height, cushion, snugness?', tip: 'Always fit shoes with the sock the customer will actually wear. A thin Balega race sock in a shoe fit with a thick Darn Tough hiking sock is a half-size difference. Bring the right sock to the fitting.' },
      { label: 'Cross-sell: nutrition, anti-blister products?', tip: 'End of the fitting. Gels, chews, Body Glide, and blister patches are natural add-ons. If they mentioned long runs, ask about their fueling strategy. If they had blisters, lead with Body Glide.' },
    ],
  },
  {
    id: 'notice',
    title: 'Things to notice',
    emoji: '👁️',
    items: [
      { label: 'Swelling — feet, ankles, lower leg', tip: 'Swelling means you need more volume. Note the time of day — feet swell throughout the day, so a morning fitting should account for afternoon size. If severe, ask about medical history (heart, kidney, lymphatic conditions).' },
      { label: 'Bruises, bunions, blisters, hammer toes', tip: 'Each signals a specific pressure problem. Bunions need a wide toe box with no seam at the first MTP joint. Hammer toes need extra height in the forefoot. Blisters indicate friction — look at seam placement in the trial shoe.' },
      { label: 'Toe fungus', tip: 'Signals a moisture and ventilation problem. Recommend a breathable mesh upper and moisture-wicking socks. Handle this gracefully — don\'t draw attention to it awkwardly, just factor it into recommendations.' },
      { label: 'When was the last scan?', tip: 'Feet change — especially after pregnancy, major weight change (±20 lbs), or around age 40+. Scan data more than a year old can be significantly off. Push for a fresh scan if it has been a while.' },
      { label: 'What socks are they wearing right now?', tip: 'If they showed up in cotton ankle socks for a marathon fitting, address the sock first. Cotton holds moisture and causes blisters. Lead with the right sock for the right activity before you even touch a shoe.' },
      { label: 'Colors they are wearing / shoe color of current pair', tip: 'A quick visual read for color matching. If everything they own is navy and grey, a neon orange shoe is probably not the move — unless they are a runner who wants high visibility.' },
      { label: 'Balance — watch them walk to the scan box', tip: 'You can spot pronation, supination, a leg-length discrepancy, or a limp before the Volumental even starts. The gait walk to the machine is data. Note what you see before the scan confirms it.' },
      { label: 'Age and overall physical presentation', tip: 'Older customers often need extra cushion (fat pad atrophy is real after 60), wider toe box, and easier closure (BOA, wide lace zone, or elastic lacing). They are also more likely to have doctor recommendations worth following.' },
    ],
  },
  {
    id: 'scan',
    title: 'Scan protocol',
    emoji: '📐',
    items: [
      { label: 'Explain the scan before you start', tip: 'Say exactly what will happen: "We\'re going to do a 3D scan of your foot — painless, takes about 2 minutes. It gives us your arch height, width, and pressure patterns so we can match you to the right shoe." Customers who know what to expect are calmer and stand more naturally.' },
      { label: 'Shoes and socks off — both feet, pants rolled to the knee', tip: 'Socks affect the pressure plate reading and can slightly distort the 3D width scan. Pants dragging on the foot change the silhouette. Do both feet every time — left-right asymmetry is common and clinically meaningful.' },
      { label: 'Oofos on to walk to the scan box', tip: 'Keep the plantar surface clean from the bench to the box. Bare feet walking on the sales floor pick up lint and debris that contaminates the pressure plate and can affect the scan.' },
      { label: 'Step into the Volumental box — don\'t cover circles or lines, stand still', tip: 'The circular markers are camera calibration points. The lines define the valid scan zone. Covering either corrupts the 3D model and forces a rescan. Tell the customer before they step in: "Try not to stand on the circles or lines."' },
      { label: 'Pressure plate walk — straight across, eyes up, naturally', tip: 'Walk past the blue tape, straight across the pressure plate — looking forward, not at the floor. "Naturally" is the key word: most people look down and shorten their stride. Have them walk toward a point on the far wall. Repeat 2–3 times for a reliable pressure average.' },
      { label: 'Oofos back on, return to bench, explain the data', tip: 'Walk them through the three key metrics: arch height (how high the arch is at rest), arch flexibility (how much it flattens under load), and pressure distribution (medial/lateral loading pattern). Use the Shoe IQ scan panel to map those readings to shoe and insert recommendations in real time.' },
    ],
  },
];

export default function ConsultationChecklist() {
  const [openSection, setOpenSection] = useState('ask');
  const [openItem, setOpenItem] = useState(null);

  function toggleSection(id) {
    setOpenSection(openSection === id ? null : id);
    setOpenItem(null);
  }

  function toggleItem(key) {
    setOpenItem(openItem === key ? null : key);
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="bar" />
        <h3>Consultation checklist</h3>
        <span className="panel-subtitle">Tap any item for outfitter coaching notes</span>
      </div>
      <div className="checklist-sections">
        {SECTIONS.map(section => {
          const isOpen = openSection === section.id;
          return (
            <div key={section.id} className={`checklist-section${isOpen ? ' open' : ''}`}>
              <button className="checklist-section-header" onClick={() => toggleSection(section.id)}>
                <span className="section-emoji">{section.emoji}</span>
                <span className="section-title">{section.title}</span>
                <span className="section-count">{section.items.length} items</span>
                <span className="section-chevron">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="checklist-items">
                  {section.items.map((item, i) => {
                    const key = `${section.id}-${i}`;
                    const expanded = openItem === key;
                    return (
                      <div key={key} className={`checklist-item${expanded ? ' expanded' : ''}`}>
                        <button className="checklist-item-header" onClick={() => toggleItem(key)}>
                          <span className="item-check">✓</span>
                          <span className="item-label">{item.label}</span>
                          <span className="item-tip-icon">{expanded ? '−' : '+'}</span>
                        </button>
                        {expanded && (
                          <div className="item-tip">
                            <span className="tip-badge">Outfitter tip</span>
                            {item.tip}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
