import { useEffect } from "react";

const STYLE = `
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #080808;
  --bg2: #121212;
  --bg3: #0a0a0a;
  --gold: #C9A96E;
  --gold-dim: rgba(201, 169, 110, 0.15);
  --text: #E0E0E0;
  --text-muted: #888888;
  --white: #FAFAF7;
  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'Raleway', sans-serif;

  /* === Tipografia tunável (hero / steps / cta) === */
  --hero-tag-size: 11px;
  --hero-tag-mb: 24px;
  --hero-h1-size: clamp(32px, 5vw, 52px);
  --hero-h1-lh: 1.15;
  --hero-h1-mb: 24px;
  --hero-p-size: 16px;
  --hero-p-lh: 1.8;
  --hero-p-mb: 40px;
  --hero-pad-top: 80px;
  --hero-pad-bottom: 80px;

  --step-num-size: 48px;
  --step-num-mb: 12px;
  --step-title-size: 16px;
  --step-title-mb: 8px;
  --step-desc-size: 14px;
  --step-desc-lh: 1.7;
  --steps-gap: 48px;
  --steps-mt: 48px;
  --step-pad-y: 0px;

  --cta-font-size: 13px;
  --cta-pad-y: 18px;
  --cta-pad-x: 48px;
  --cta-letter: 0.12em;
  --cta-mt: 0px;
}

html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--text); font-family: var(--sans); font-weight: 300; line-height: 1.7; -webkit-font-smoothing: antialiased; }

a { color: var(--gold); text-decoration: none; }

.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

/* ===== HERO ===== */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.hero-bg {
  position: absolute; inset: 0;
  background: url('/images/pack/hero.png') center/cover no-repeat;
  opacity: 0.25;
  filter: blur(1px);
}
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.6) 100%);
}
.hero-content {
  position: relative; z-index: 2;
  max-width: 680px;
  padding: var(--hero-pad-top) 0 var(--hero-pad-bottom);
}
.hero-tag {
  font-family: var(--sans);
  font-size: var(--hero-tag-size);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: var(--hero-tag-mb);
}
.hero h1 {
  font-family: var(--serif);
  font-size: var(--hero-h1-size);
  font-weight: 300;
  color: var(--white);
  line-height: var(--hero-h1-lh);
  margin-bottom: var(--hero-h1-mb);
}
.hero h1 span { color: var(--gold); }
.hero p {
  font-size: var(--hero-p-size);
  color: var(--text);
  max-width: 540px;
  margin-bottom: var(--hero-p-mb);
  line-height: var(--hero-p-lh);
}
.cta {
  display: inline-block;
  background: var(--gold);
  color: #080808;
  font-family: var(--sans);
  font-size: var(--cta-font-size);
  font-weight: 600;
  letter-spacing: var(--cta-letter);
  text-transform: uppercase;
  padding: var(--cta-pad-y) var(--cta-pad-x);
  margin-top: var(--cta-mt);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}
.cta:hover { background: #d4b87a; transform: translateY(-1px); }

/* ===== CONTRASTE ===== */
.contrast {
  background: var(--bg2);
  padding: 100px 0;
}
.contrast-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}
.contrast h2 {
  font-family: var(--serif);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 300;
  color: var(--white);
  margin-bottom: 32px;
  line-height: 1.2;
}
.cost-item {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 15px;
}
.cost-item .label { color: var(--text-muted); }
.cost-item .value { color: var(--text); font-weight: 400; }
.cost-total {
  display: flex;
  justify-content: space-between;
  padding: 20px 0;
  margin-top: 8px;
  border-top: 1px solid var(--gold);
  font-size: 17px;
  font-weight: 500;
}
.cost-total .value { color: var(--gold); }
.contrast-right {
  text-align: center;
}
.contrast-price {
  font-family: var(--serif);
  font-size: 72px;
  font-weight: 300;
  color: var(--gold);
  line-height: 1;
  margin-bottom: 8px;
}
.contrast-label {
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.contrast-note {
  font-size: 14px;
  color: var(--text);
  margin-bottom: 32px;
}

/* ===== SHOWCASE ===== */
.showcase {
  padding: 100px 0;
  background: var(--bg);
}
.section-tag {
  font-size: 11px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 16px;
}
.section-title {
  font-family: var(--serif);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 300;
  color: var(--white);
  margin-bottom: 12px;
  line-height: 1.2;
}
.section-sub {
  font-size: 15px;
  color: var(--text-muted);
  margin-bottom: 48px;
  max-width: 500px;
}
.grid-showcase {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.grid-showcase img {
  width: 100%;
  height: 360px;
  object-fit: cover;
  border-radius: 4px;
  transition: transform 0.4s ease;
}
.grid-showcase img:hover { transform: scale(1.02); }

/* ===== PRODUTO ===== */
.product {
  padding: 100px 0;
  background: var(--bg2);
}
.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}
.product h2 {
  font-family: var(--serif);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 300;
  color: var(--white);
  margin-bottom: 24px;
}
.product-intro {
  font-size: 15px;
  color: var(--text-muted);
  margin-bottom: 32px;
}
.category {
  padding: 16px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.category-num {
  font-family: var(--serif);
  font-size: 24px;
  color: var(--gold);
  display: inline;
  margin-right: 12px;
}
.category-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--white);
}
.category-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
  padding-left: 36px;
}
.product-highlight {
  margin-top: 32px;
  padding: 20px 24px;
  background: var(--gold-dim);
  border-left: 2px solid var(--gold);
  font-size: 14px;
  color: var(--text);
  line-height: 1.7;
}
.mockup-area {
  display: flex;
  align-items: center;
  justify-content: center;
}
.mockup-visual {
  background: var(--bg3);
  border: 1px solid rgba(201,169,110,0.2);
  border-radius: 8px;
  padding: 48px 40px;
  text-align: center;
  width: 100%;
  max-width: 400px;
}
.mockup-tag {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--gold);
  text-transform: uppercase;
  margin-bottom: 16px;
}
.mockup-title {
  font-family: var(--serif);
  font-size: 28px;
  font-weight: 300;
  color: var(--white);
  margin-bottom: 8px;
}
.mockup-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 24px;
}
.mockup-line {
  width: 40px;
  height: 1px;
  background: var(--gold);
  margin: 0 auto 24px;
}
.mockup-cats {
  text-align: left;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 2;
}
.mockup-cats span { color: var(--gold); margin-right: 8px; }

/* ===== COMO FUNCIONA ===== */
.how {
  padding: 100px 0;
  background: var(--bg);
}
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--steps-gap);
  margin-top: var(--steps-mt);
}
.step { padding: var(--step-pad-y) 0; }
.step-num {
  font-family: var(--serif);
  font-size: var(--step-num-size);
  color: var(--gold);
  opacity: 0.6;
  margin-bottom: var(--step-num-mb);
  line-height: 1;
}
.step-title {
  font-size: var(--step-title-size);
  font-weight: 500;
  color: var(--white);
  margin-bottom: var(--step-title-mb);
  line-height: 1.35;
}
.step-desc {
  font-size: var(--step-desc-size);
  color: var(--text-muted);
  line-height: var(--step-desc-lh);
}

/* ===== BONUS ===== */
.bonus {
  padding: 100px 0;
  background: var(--bg2);
}
.bonus-card {
  max-width: 700px;
  margin: 0 auto;
  text-align: center;
  padding: 60px 48px;
  border: 1px solid rgba(201,169,110,0.2);
  border-radius: 4px;
}
.bonus-tag {
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 16px;
}
.bonus h2 {
  font-family: var(--serif);
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 300;
  color: var(--white);
  margin-bottom: 20px;
}
.bonus p {
  font-size: 15px;
  color: var(--text-muted);
  max-width: 520px;
  margin: 0 auto 20px;
  line-height: 1.8;
}
.bonus-items {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 24px;
}
.bonus-item {
  font-size: 13px;
  color: var(--gold);
  padding: 8px 20px;
  border: 1px solid rgba(201,169,110,0.3);
  border-radius: 24px;
}

/* ===== PROVA SOCIAL ===== */
.proof {
  padding: 100px 0;
  background: var(--bg);
}
.proof-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 48px;
}
.proof-grid img {
  width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
}

/* ===== PARA QUEM ===== */
.for-who {
  padding: 100px 0;
  background: var(--bg2);
}
.for-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  margin-top: 48px;
}
.for-col h3 {
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 400;
  color: var(--white);
  margin-bottom: 20px;
}
.for-col h3.no { color: var(--text-muted); }
.for-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font-size: 14px;
  color: var(--text);
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.for-item .icon { color: var(--gold); flex-shrink: 0; margin-top: 2px; }
.for-item.no .icon { color: var(--text-muted); }

/* ===== FAQ ===== */
.faq {
  padding: 100px 0;
  background: var(--bg);
}
.faq-list {
  max-width: 700px;
  margin: 48px auto 0;
}
.faq-item {
  padding: 24px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.faq-q {
  font-size: 15px;
  font-weight: 500;
  color: var(--white);
  margin-bottom: 8px;
}
.faq-a {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.7;
}

/* ===== GARANTIA ===== */
.guarantee {
  text-align: center;
  padding: 60px 0;
  background: var(--bg);
}
.guarantee-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.guarantee h3 {
  font-family: var(--serif);
  font-size: 24px;
  color: var(--white);
  font-weight: 300;
  margin-bottom: 8px;
}
.guarantee p {
  font-size: 14px;
  color: var(--text-muted);
}

/* ===== CTA FINAL ===== */
.final-cta {
  padding: 120px 0;
  background: var(--bg2);
  text-align: center;
}
.final-price-tag {
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.final-price {
  font-family: var(--serif);
  font-size: clamp(56px, 8vw, 80px);
  font-weight: 300;
  color: var(--gold);
  line-height: 1;
  margin-bottom: 16px;
}
.final-includes {
  font-size: 15px;
  color: var(--text);
  margin-bottom: 8px;
}
.final-bonus {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 40px;
}
.final-delivery {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 20px;
}

/* ===== FOOTER ===== */
footer {
  padding: 40px 0;
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.04);
  background: var(--bg);
}
footer p {
  font-size: 12px;
  color: var(--text-muted);
}

/* ===== DIVIDER ===== */
.gold-line {
  width: 40px;
  height: 1px;
  background: var(--gold);
  margin-bottom: 24px;
}
.gold-line.center { margin: 0 auto 24px; }

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .container { padding: 0 32px; }
  .contrast, .showcase, .product, .how, .bonus, .proof, .for-who, .faq { padding: 80px 0; }
  .final-cta { padding: 90px 0; }
  .product-grid { gap: 48px; }
  .grid-showcase img { height: 280px; }
  :root { --steps-gap: 32px; }
}

/* ===== Tablet & abaixo ===== */
@media (max-width: 768px) {
  :root {
    --hero-pad-top: 100px;
    --hero-pad-bottom: 64px;
    --hero-tag-size: 10.5px;
    --hero-tag-mb: 20px;
    --hero-h1-size: clamp(30px, 6.4vw, 40px);
    --hero-h1-mb: 20px;
    --hero-p-size: 15px;
    --hero-p-lh: 1.7;
    --hero-p-mb: 32px;
    --steps-gap: 28px;
    --steps-mt: 32px;
    --step-num-size: 40px;
    --step-num-mb: 8px;
    --step-title-size: 15px;
    --step-desc-size: 13.5px;
    --cta-pad-x: 24px;
  }
  .container { padding: 0 24px; }
  .contrast-grid, .product-grid, .for-grid { grid-template-columns: 1fr; gap: 40px; }
  .grid-showcase { grid-template-columns: 1fr 1fr; gap: 6px; }
  .grid-showcase img { height: 240px; }
  .steps { grid-template-columns: 1fr; }
  .proof-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; gap: 16px; }
  .hero { min-height: auto; }
  .hero-bg { opacity: 0.18; }
  .hero-overlay { background: linear-gradient(180deg, rgba(8,8,8,0.88) 0%, rgba(8,8,8,0.94) 100%); }
  .contrast, .showcase, .product, .how, .bonus, .proof, .for-who, .faq { padding: 64px 0; }
  .final-cta { padding: 72px 0; }
  .contrast-right { margin-top: 32px; }
  .contrast-price { font-size: 60px; }
  .bonus-card { padding: 40px 24px; }
  .section-sub { margin-bottom: 36px; }
  .cta { display: block; width: 100%; text-align: center; min-height: 52px; }
}

/* ===== Mobile padrão (≤480px) ===== */
@media (max-width: 480px) {
  :root {
    --hero-pad-top: 92px;
    --hero-pad-bottom: 56px;
    --hero-tag-size: 10px;
    --hero-tag-mb: 18px;
    --hero-h1-size: 30px;
    --hero-h1-lh: 1.18;
    --hero-h1-mb: 18px;
    --hero-p-size: 14.5px;
    --hero-p-mb: 28px;
    --steps-gap: 24px;
    --steps-mt: 28px;
    --step-num-size: 36px;
    --step-num-mb: 6px;
    --step-title-size: 14.5px;
    --step-title-mb: 6px;
    --step-desc-size: 13px;
    --step-desc-lh: 1.65;
    --cta-font-size: 12.5px;
    --cta-pad-y: 17px;
    --cta-letter: 0.14em;
    --cta-mt: 4px;
  }
  .container { padding: 0 20px; }
  .grid-showcase { grid-template-columns: 1fr; gap: 8px; }
  .grid-showcase img { height: 320px; }
  .contrast, .showcase, .product, .how, .bonus, .proof, .for-who, .faq { padding: 56px 0; }
  .final-cta { padding: 64px 0; }
  .contrast-price { font-size: 52px; }
  .mockup-visual { padding: 36px 24px; }
  .bonus-card { padding: 36px 20px; }
  .bonus-items { gap: 12px; }
  .bonus-item { padding: 7px 16px; font-size: 12px; }
  .category-num { font-size: 20px; }
  .category-desc { padding-left: 30px; }
  .section-tag { font-size: 10px; }
}

/* ===== iPhone padrão (≤414px) ===== */
@media (max-width: 414px) {
  :root {
    --hero-pad-top: 88px;
    --hero-pad-bottom: 52px;
    --hero-h1-size: 28px;
    --hero-h1-mb: 16px;
    --hero-p-size: 14px;
    --hero-p-mb: 26px;
    --steps-gap: 22px;
    --step-num-size: 34px;
    --cta-pad-y: 16px;
  }
  .container { padding: 0 18px; }
}

/* ===== iPhone SE / pequenos (≤375px) ===== */
@media (max-width: 375px) {
  :root {
    --hero-pad-top: 80px;
    --hero-pad-bottom: 48px;
    --hero-tag-size: 9.5px;
    --hero-tag-mb: 16px;
    --hero-h1-size: 26px;
    --hero-h1-lh: 1.2;
    --hero-h1-mb: 16px;
    --hero-p-size: 13.5px;
    --hero-p-lh: 1.65;
    --hero-p-mb: 24px;
    --steps-gap: 20px;
    --steps-mt: 24px;
    --step-num-size: 32px;
    --step-title-size: 14px;
    --step-desc-size: 12.5px;
    --cta-font-size: 12px;
    --cta-pad-y: 15px;
  }
  .container { padding: 0 16px; }
  .contrast-price { font-size: 46px; }
}

/* ===== Galaxy / pequenos extras (≤360px) ===== */
@media (max-width: 360px) {
  :root {
    --hero-h1-size: 25px;
    --hero-p-size: 13px;
    --step-num-size: 30px;
    --cta-font-size: 11.5px;
    --cta-letter: 0.12em;
  }
  .container { padding: 0 14px; }
}
`;
const BODY_HTML = `

<!-- ===== HERO ===== -->
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-overlay"></div>
  <div class="container hero-content">
    <div class="hero-tag">Velora Studio</div>
    <h1>50 prompts que criam campanhas de <span>R$ 5.000</span>.<br>Por R$ 37.</h1>
    <p>Crie imagens para sua marca com atmosfera de luxo, direção de luz profissional e resultado visual indistinguível de uma produção fotográfica tradicional. Sem precisar saber sobre IA.</p>
    <a href="https://pay.kiwify.com.br/SLgYyHP" class="cta">QUERO ACESSO IMEDIATO</a>
  </div>
</section>

<!-- ===== CONTRASTE ===== -->
<section class="contrast">
  <div class="container">
    <div class="contrast-grid">
      <div>
        <div class="section-tag">O contraste</div>
        <h2>O fim das produções caras e demoradas.</h2>
        <div class="cost-item">
          <span class="label">Fotógrafo profissional</span>
          <span class="value">R$ 1.500+</span>
        </div>
        <div class="cost-item">
          <span class="label">Aluguel de estúdio</span>
          <span class="value">R$ 800+</span>
        </div>
        <div class="cost-item">
          <span class="label">Modelo + maquiagem</span>
          <span class="value">R$ 1.200+</span>
        </div>
        <div class="cost-total">
          <span class="label">Total por ensaio</span>
          <span class="value">R$ 3.500 — R$ 5.000</span>
        </div>
      </div>
      <div class="contrast-right">
        <div class="contrast-label">Pack Editorial Velora</div>
        <div class="contrast-price">R$ 37</div>
        <div class="contrast-note">Campanhas ilimitadas. Entrega imediata.</div>
        <a href="https://pay.kiwify.com.br/SLgYyHP" class="cta">QUERO ACESSO IMEDIATO</a>
      </div>
    </div>
  </div>
</section>

<!-- ===== SHOWCASE ===== -->
<section class="showcase">
  <div class="container">
    <div class="section-tag">Resultados reais</div>
    <div class="section-title">Sua marca com direção de arte internacional.</div>
    <div class="section-sub">Não é sobre apertar botões. É sobre ter os prompts certos.</div>
    <div class="grid-showcase">
      <img src="/images/pack/showcase1.jpg" alt="Campanha editorial bolsa e terno" loading="lazy">
      <img src="/images/pack/showcase2.jpg" alt="Campanha editorial óculos" loading="lazy">
      <img src="/images/pack/showcase3.png" alt="Campanha editorial masculina" loading="lazy">
      <img src="/images/pack/showcase4.png" alt="Campanha editorial praia" loading="lazy">
      <img src="/images/pack/showcase5.png" alt="Campanha editorial joias" loading="lazy">
      <img src="/images/pack/showcase6.png" alt="Campanha editorial feminina" loading="lazy">
    </div>
  </div>
</section>

<!-- ===== PRODUTO ===== -->
<section class="product">
  <div class="container">
    <div class="product-grid">
      <div class="mockup-area">
        <div class="mockup-visual">
          <div class="mockup-tag">Pack Editorial</div>
          <div class="mockup-title">50 Prompts</div>
          <div class="mockup-sub">Campanhas com IA</div>
          <div class="mockup-line"></div>
          <div class="mockup-cats">
            <span>01</span> Produto no Centro<br>
            <span>02</span> Modelo com Produto<br>
            <span>03</span> Campanha Sazonal<br>
            <span>04</span> Atmosfera e Lifestyle<br>
            <span>05</span> Direção Criativa Avançada
          </div>
        </div>
      </div>
      <div>
        <div class="section-tag">O que você recebe</div>
        <h2>50 prompts organizados em 5 categorias estratégicas.</h2>
        <div class="product-intro">Cada categoria resolve um tipo diferente de necessidade visual da sua marca.</div>
        <div class="category">
          <span class="category-num">01</span>
          <span class="category-name">Produto no Centro</span>
          <div class="category-desc">Foco total no item com luz editorial, atmosfera e composição intencional.</div>
        </div>
        <div class="category">
          <span class="category-num">02</span>
          <span class="category-name">Modelo com Produto</span>
          <div class="category-desc">Campanhas com figura humana, naturalidade e referências de grandes grifes.</div>
        </div>
        <div class="category">
          <span class="category-num">03</span>
          <span class="category-name">Campanha Sazonal</span>
          <div class="category-desc">Dia das Mães, Natal, Black Friday, verão — prompts para cada data que importa.</div>
        </div>
        <div class="category">
          <span class="category-num">04</span>
          <span class="category-name">Atmosfera e Lifestyle</span>
          <div class="category-desc">Construa o universo da marca sem mostrar o produto diretamente.</div>
        </div>
        <div class="category">
          <span class="category-num">05</span>
          <span class="category-name">Direção Criativa Avançada</span>
          <div class="category-desc">Resultados autorais e conceituais para marcas que querem se diferenciar.</div>
        </div>
        <div class="product-highlight">
          Cada prompt tem a variável <strong>[produto]</strong> destacada. Você só substitui pelo nome do seu produto e gera. Funciona em Midjourney, DALL-E, Firefly, Leonardo e qualquer ferramenta de IA.
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== COMO FUNCIONA ===== -->
<section class="how">
  <div class="container">
    <div class="gold-line center"></div>
    <div style="text-align:center">
      <div class="section-tag">Como funciona</div>
      <div class="section-title" style="max-width:500px;margin:0 auto 0;">Três passos. Resultado em minutos.</div>
    </div>
    <div class="steps">
      <div>
        <div class="step-num">01</div>
        <div class="step-title">Escolha</div>
        <div class="step-desc">Selecione o prompt da categoria que faz sentido para o seu objetivo — lançamento, campanha sazonal, conteúdo recorrente.</div>
      </div>
      <div>
        <div class="step-num">02</div>
        <div class="step-title">Substitua</div>
        <div class="step-desc">Troque a variável [produto] pelo seu item — seja específico. "Bolsa de couro marrom" funciona melhor que só "bolsa".</div>
      </div>
      <div>
        <div class="step-num">03</div>
        <div class="step-title">Gere</div>
        <div class="step-desc">Cole na sua ferramenta de IA favorita — Midjourney, DALL-E, Firefly, Leonardo — e tenha o resultado em segundos.</div>
      </div>
    </div>
  </div>
</section>

<!-- ===== BÔNUS ===== -->
<section class="bonus">
  <div class="container">
    <div class="bonus-card">
      <div class="bonus-tag">Bônus especial incluso</div>
      <h2>Como pensa um diretor de arte para marcas.</h2>
      <p>Não basta gerar — é preciso saber curar. Receba um guia exclusivo da Velora Studio ensinando a metodologia por trás de cada campanha editorial.</p>
      <div class="bonus-items">
        <span class="bonus-item">Luz</span>
        <span class="bonus-item">Paleta</span>
        <span class="bonus-item">Cenário</span>
        <span class="bonus-item">Composição</span>
        <span class="bonus-item">Expressão</span>
      </div>
    </div>
  </div>
</section>

<!-- ===== PROVA SOCIAL ===== -->
<section class="proof">
  <div class="container">
    <div class="gold-line center"></div>
    <div style="text-align:center">
      <div class="section-tag">Quem já usa</div>
      <div class="section-title" style="max-width:500px;margin:0 auto;">O atalho para quem quer resultado.</div>
    </div>
    <div class="proof-grid">
      <img src="/images/pack/proof1.jpg" alt="Depoimento de cliente" loading="lazy">
      <img src="/images/pack/proof2.jpg" alt="Depoimento de cliente" loading="lazy">
      <img src="/images/pack/proof3.png" alt="Depoimento Instagram" loading="lazy">
    </div>
  </div>
</section>

<!-- ===== PARA QUEM ===== -->
<section class="for-who">
  <div class="container">
    <div class="gold-line center"></div>
    <div style="text-align:center">
      <div class="section-tag">Para quem é</div>
      <div class="section-title" style="max-width:500px;margin:0 auto;">Feito para quem quer resultado sem complexidade.</div>
    </div>
    <div class="for-grid">
      <div class="for-col">
        <h3>Para você se:</h3>
        <div class="for-item"><span class="icon">→</span> Tem uma marca e quer imagens editoriais sem contratar fotógrafo</div>
        <div class="for-item"><span class="icon">→</span> É criativo ou freelancer e quer atender clientes com IA</div>
        <div class="for-item"><span class="icon">→</span> Quer resultado rápido sem aprender tudo do zero</div>
        <div class="for-item"><span class="icon">→</span> Cansou de imagens genéricas que não comunicam valor</div>
        <div class="for-item"><span class="icon">→</span> Precisa de conteúdo visual consistente com orçamento limitado</div>
      </div>
      <div class="for-col">
        <h3 class="no">Não é para você se:</h3>
        <div class="for-item no"><span class="icon">—</span> Quer aprender a metodologia completa de direção artística (para isso existe o Curso Velora R$ 497)</div>
        <div class="for-item no"><span class="icon">—</span> Espera resultado sem nenhum esforço de curadoria</div>
        <div class="for-item no"><span class="icon">—</span> Não tem interesse em usar ferramentas de IA</div>
      </div>
    </div>
  </div>
</section>

<!-- ===== GARANTIA ===== -->
<section class="guarantee">
  <div class="container">
    <div class="guarantee-icon">◇</div>
    <h3>7 dias de garantia incondicional.</h3>
    <p>Se não gostar, devolvemos 100% do valor. Sem perguntas. Risco zero.</p>
  </div>
</section>

<!-- ===== FAQ ===== -->
<section class="faq">
  <div class="container">
    <div class="gold-line center"></div>
    <div style="text-align:center">
      <div class="section-tag">Dúvidas</div>
      <div class="section-title" style="max-width:500px;margin:0 auto;">Perguntas frequentes.</div>
    </div>
    <div class="faq-list">
      <div class="faq-item">
        <div class="faq-q">Funciona para o meu nicho?</div>
        <div class="faq-a">Sim. Cada prompt tem a variável [produto] que você adapta para qualquer tipo de item — moda, beleza, acessórios, decoração, gastronomia, qualquer produto físico.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Preciso saber usar IA?</div>
        <div class="faq-a">Não. Os prompts já contêm toda a engenharia técnica e direção de arte. Você só copia, substitui [produto] pelo seu e cola na ferramenta.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Como recebo?</div>
        <div class="faq-a">Acesso imediato em PDF direto no seu e-mail após a compra aprovada. Sem espera.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Funciona em qual ferramenta de IA?</div>
        <div class="faq-a">Midjourney, DALL-E, Adobe Firefly, Leonardo AI, ou qualquer outra que aceite prompts de texto.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Posso usar para clientes?</div>
        <div class="faq-a">Sim. Os prompts são seus — use para a sua marca ou para atender marcas como prestador de serviço.</div>
      </div>
    </div>
  </div>
</section>

<!-- ===== CTA FINAL ===== -->
<section class="final-cta">
  <div class="container">
    <div class="gold-line center"></div>
    <div class="final-price-tag">Pack Editorial Velora</div>
    <div class="final-price">R$ 37</div>
    <div class="final-includes">50 prompts editoriais + Bônus: Guia de Direção de Arte</div>
    <div class="final-bonus">Entrega imediata • Garantia de 7 dias • Acesso vitalício</div>
    <a href="https://pay.kiwify.com.br/SLgYyHP" class="cta">QUERO ACESSO IMEDIATO</a>
    <div class="final-delivery">Pagamento seguro via Kiwify. Acesso liberado em segundos após a confirmação.</div>
  </div>
</section>

<!-- ===== FOOTER ===== -->
<footer>
  <div class="container">
    <p>© 2026 Velora Studio — estudiovelora.net</p>
  </div>
</footer>

`;

const Pack = () => {
  useEffect(() => {
    // Load fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Raleway:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    const prevTitle = document.title;
    document.title = "Pack Editorial Velora — 50 Prompts para Campanhas com IA";
    return () => {
      document.head.removeChild(link);
      document.title = prevTitle;
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />
    </>
  );
};

export default Pack;
