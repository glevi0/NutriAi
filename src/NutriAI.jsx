import { useState, useEffect, useRef, useCallback } from "react";

// ── Palette & helpers ──────────────────────────────────────────────────────────
const C = {
  gold: "#D4A065", goldDark: "#C4905A", goldDeep: "#B4804A",
  goldLight: "#F5E6D3", goldFaint: "#FFFBF5",
  cream: "#FFFEF7", creamDark: "#FFF8E1",
  slate900: "#0F172A", slate800: "#1E293B", slate700: "#334155",
  slate600: "#475569", slate500: "#64748B", slate400: "#94A3B8",
  slate200: "#E2E8F0", slate100: "#F1F5F9", slate50: "#F8FAFC",
  white: "#FFFFFF",
  emerald: "#10B981", amber: "#F59E0B", rose: "#F43F5E",
  blue: "#3B82F6", purple: "#8B5CF6", teal: "#14B8A6",
};

const grad = `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`;
const gradHover = `linear-gradient(135deg, ${C.goldDark}, ${C.goldDeep})`;

// ── Claude API helper ──────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt, maxTokens = 1000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

async function callClaudeJSON(systemPrompt, userPrompt, maxTokens = 1500) {
  const text = await callClaude(systemPrompt, userPrompt, maxTokens);
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Invalid JSON from AI");
  }
}

// ── Storage helpers ────────────────────────────────────────────────────────────
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── Micro components ───────────────────────────────────────────────────────────
function Spinner({ size = 20, color = C.gold }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid ${color}30`,
      borderTop: `2px solid ${color}`, borderRadius: "50%",
      animation: "spin 0.8s linear infinite, fadeIn 0.3s ease",
      flexShrink: 0,
    }} />
  );
}

function Btn({ children, onClick, disabled, variant = "primary", size = "md", style = {}, icon }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontWeight: 600, transition: "all 0.2s",
    opacity: disabled ? 0.6 : 1,
    borderRadius: size === "sm" ? 10 : 14,
    padding: size === "sm" ? "6px 14px" : size === "lg" ? "14px 32px" : "10px 22px",
    fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
  };
  const variants = {
    primary: { background: grad, color: C.white, boxShadow: `0 4px 16px ${C.gold}40` },
    secondary: { background: C.goldFaint, color: C.goldDark, border: `1.5px solid ${C.goldLight}` },
    ghost: { background: "transparent", color: C.slate600 },
    danger: { background: "#FEE2E2", color: "#DC2626" },
    outline: { background: C.white, color: C.slate700, border: `1.5px solid ${C.slate200}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

function Card({ children, style = {}, className }) {
  return (
    <div style={{
      background: C.white, borderRadius: 20, border: `1px solid ${C.slate100}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ children, color = C.gold }) {
  return (
    <span style={{
      background: color + "18", color, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20, border: `1px solid ${color}30`,
    }}>{children}</span>
  );
}

function MacroBar({ label, value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.slate500, marginBottom: 4 }}>
        <span>{label}</span><span style={{ fontWeight: 700, color }}>{value}g</span>
      </div>
      <div style={{ height: 6, background: C.slate100, borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s" }} />
      </div>
    </div>
  );
}

// ── PAGES ──────────────────────────────────────────────────────────────────────

// Landing Page
function Landing({ onStart }) {
  const features = [
    { icon: "🧠", title: "AI-Powered Plans", desc: "Claude AI crafts meals tailored to your goals" },
    { icon: "🎯", title: "Personalized", desc: "Adapts to your body, preferences & lifestyle" },
    { icon: "📋", title: "Full Recipes", desc: "Detailed ingredients & step-by-step instructions" },
    { icon: "🛒", title: "Shopping Lists", desc: "Auto-generate lists from your meal plan" },
    { icon: "💧", title: "Hydration Tracking", desc: "Track your daily water intake" },
    { icon: "📊", title: "Macro Calculator", desc: "Know your exact calorie & macro targets" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.cream} 0%, ${C.creamDark} 50%, ${C.goldFaint} 100%)`, padding: "0 20px", fontFamily: "'Georgia', serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 60, paddingBottom: 60 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, background: grad, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: `0 8px 32px ${C.gold}40` }}>✨</div>
            <span style={{ fontSize: 34, fontWeight: 800, color: C.slate900, letterSpacing: -1 }}>NutriAI</span>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: C.slate900, lineHeight: 1.15, margin: "0 0 16px", letterSpacing: -1.5 }}>
            Your Personal<br />
            <span style={{ background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Nutritionist</span>
          </h1>
          <p style={{ fontSize: 17, color: C.slate600, lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>
            Personalized meal plans powered by AI — tailored to your goals, body & preferences.
          </p>
        </div>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Btn onClick={onStart} size="lg" style={{ fontSize: 17, padding: "16px 40px", borderRadius: 18, boxShadow: `0 8px 32px ${C.gold}50` }}>
            Get Started Free →
          </Btn>
          <p style={{ fontSize: 13, color: C.slate400, marginTop: 12 }}>No credit card required</p>
        </div>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 40 }}>
          {features.map(f => (
            <Card key={f.title} style={{ padding: "18px 16px" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.slate800, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: C.slate500, lineHeight: 1.5 }}>{f.desc}</div>
            </Card>
          ))}
        </div>

        {/* Meal types */}
        <Card style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: C.slate500, marginBottom: 14, textAlign: "center" }}>Everything included:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {["🌅 Breakfast", "☀️ Lunch", "🌙 Dinner", "🍎 Snacks", "⚡ Pre-Workout", "💪 Post-Workout"].map(m => (
              <span key={m} style={{ fontSize: 13, padding: "5px 14px", background: C.goldFaint, borderRadius: 20, color: C.goldDark, border: `1px solid ${C.goldLight}`, fontWeight: 600 }}>{m}</span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Onboarding
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const TOTAL = 5;
  const [form, setForm] = useState({
    full_name: "", age: "", weight: "", height: "",
    weightUnit: "kg", heightUnit: "cm",
    goal: "", activity_level: "", training_schedule: {},
    dietary_preferences: ["none"], allergies: [],
    include_snacks: false, snack_count: 1,
    include_pre_workout: false, include_post_workout: false,
  });

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const canNext = () => {
    if (step === 1) return !!form.goal;
    if (step === 2) return !!form.activity_level;
    if (step === 3) return form.full_name && form.age && form.weight && form.height;
    return true;
  };

  const goals = [
    { id: "lose_weight_build_muscle", label: "Lose Weight & Build Muscle", icon: "🏋️", desc: "Transform body composition" },
    { id: "lose_weight", label: "Lose Weight", icon: "⚖️", desc: "Shed pounds sustainably" },
    { id: "build_athleticism", label: "Build Athleticism", icon: "🏃", desc: "Improve performance & endurance" },
    { id: "improve_health", label: "Improve Health", icon: "❤️", desc: "Feel your best daily" },
    { id: "maintain", label: "Maintain", icon: "🎯", desc: "Keep your current physique" },
  ];

  const levels = [
    { id: "sedentary", label: "Sedentary", desc: "Little to no exercise", emoji: "🛋️" },
    { id: "light", label: "Lightly Active", desc: "1-2 days/week", emoji: "🚶" },
    { id: "moderate", label: "Moderately Active", desc: "3-5 days/week", emoji: "🏃" },
    { id: "active", label: "Very Active", desc: "6-7 days/week", emoji: "💪" },
    { id: "very_active", label: "Athlete", desc: "Intense daily training", emoji: "🏆", sub: "Customize Training" },
  ];

  const diets = [
    { id: "none", label: "No Restrictions", emoji: "🍽️" },
    { id: "vegetarian", label: "Vegetarian", emoji: "🥬" },
    { id: "vegan", label: "Vegan", emoji: "🌱" },
    { id: "keto", label: "Keto", emoji: "🥑" },
    { id: "paleo", label: "Paleo", emoji: "🍖" },
    { id: "mediterranean", label: "Mediterranean", emoji: "🫒" },
    { id: "gluten_free", label: "Gluten Free", emoji: "🌾" },
    { id: "dairy_free", label: "Dairy Free", emoji: "🥛" },
  ];

  const toggleDiet = (id) => {
    if (id === "none") { upd("dietary_preferences", ["none"]); return; }
    const filtered = form.dietary_preferences.filter(s => s !== "none");
    const next = filtered.includes(id) ? filtered.filter(s => s !== id) : [...filtered, id];
    upd("dietary_preferences", next.length ? next : ["none"]);
  };

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div>
          <h2 style={stepTitle}>What's your goal?</h2>
          <p style={stepSub}>We'll personalize your nutrition plan</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {goals.map(g => (
              <button key={g.id} onClick={() => upd("goal", g.id)} style={{
                background: form.goal === g.id ? C.goldFaint : C.white,
                border: `2px solid ${form.goal === g.id ? C.gold : C.slate100}`,
                borderRadius: 16, padding: "16px 20px", textAlign: "left", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 16, transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 28 }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: form.goal === g.id ? C.goldDark : C.slate800, fontSize: 15 }}>{g.label}</div>
                  <div style={{ fontSize: 13, color: C.slate500 }}>{g.desc}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${form.goal === g.id ? C.gold : C.slate300}`, background: form.goal === g.id ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {form.goal === g.id && <div style={{ width: 8, height: 8, background: C.white, borderRadius: "50%" }} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
      case 2: return (
        <div>
          <h2 style={stepTitle}>How active are you?</h2>
          <p style={stepSub}>Helps us calculate your daily needs</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {levels.map(l => (
              <button key={l.id} onClick={() => upd("activity_level", l.id)} style={{
                background: form.activity_level === l.id ? C.goldFaint : C.white,
                border: `2px solid ${form.activity_level === l.id ? C.gold : C.slate100}`,
                borderRadius: 14, padding: "14px 18px", textAlign: "left", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 26 }}>{l.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: form.activity_level === l.id ? C.goldDark : C.slate800, fontSize: 14 }}>{l.label}</div>
                  <div style={{ fontSize: 12, color: C.slate500 }}>{l.desc}</div>
                  {l.sub && <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginTop: 2 }}>({l.sub})</div>}
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${form.activity_level === l.id ? C.gold : C.slate300}`, background: form.activity_level === l.id ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {form.activity_level === l.id && <div style={{ width: 7, height: 7, background: C.white, borderRadius: "50%" }} />}
                </div>
              </button>
            ))}
          </div>

          {/* Training Schedule — shown only when Athlete is selected */}
          {form.activity_level === "very_active" && (
            <div style={{
              marginTop: 20, padding: "20px 18px", borderRadius: 16,
              border: `2px solid ${C.gold}`, background: C.goldFaint,
              animation: "fadeIn 0.3s ease",
            }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.slate800, marginBottom: 4 }}>🏋️ Set Your Training Schedule</div>
              <div style={{ fontSize: 13, color: C.slate500, marginBottom: 16, lineHeight: 1.5 }}>
                Add your training times for each day. This helps us create meal plans around your workouts.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => {
                  const daySched = form.training_schedule[day] || [];
                  const addSlot = () => upd("training_schedule", { ...form.training_schedule, [day]: [...daySched, { startTime: "", endTime: "" }] });
                  const removeSlot = (i) => {
                    const updated = daySched.filter((_, idx) => idx !== i);
                    upd("training_schedule", { ...form.training_schedule, [day]: updated });
                  };
                  const updateSlot = (i, field, val) => {
                    const updated = daySched.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
                    upd("training_schedule", { ...form.training_schedule, [day]: updated });
                  };
                  return (
                    <div key={day} style={{ background: C.white, borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: daySched.length > 0 ? 10 : 0 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: C.slate700 }}>{day}</span>
                        <button onClick={addSlot} style={{ background: "none", border: "none", cursor: "pointer", color: C.goldDark, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                          + Add Training
                        </button>
                      </div>
                      {daySched.length === 0
                        ? <div style={{ fontSize: 12, color: C.slate400, fontStyle: "italic" }}>Rest day</div>
                        : daySched.map((slot, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < daySched.length - 1 ? 8 : 0 }}>
                            <input type="time" value={slot.startTime} onChange={e => updateSlot(i, "startTime", e.target.value)}
                              style={{ flex: 1, height: 36, borderRadius: 9, border: `1.5px solid ${C.slate200}`, padding: "0 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                            <span style={{ fontSize: 11, color: C.slate400 }}>to</span>
                            <input type="time" value={slot.endTime} onChange={e => updateSlot(i, "endTime", e.target.value)}
                              style={{ flex: 1, height: 36, borderRadius: 9, border: `1.5px solid ${C.slate200}`, padding: "0 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                            <button onClick={() => removeSlot(i)} style={{ background: "#FEE2E2", border: "none", color: "#DC2626", width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
      case 3: return (
        <div>
          <h2 style={stepTitle}>About You</h2>
          <p style={stepSub}>Help us personalize your experience</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input value={form.full_name} onChange={e => upd("full_name", e.target.value)} placeholder="Enter your name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <input type="number" value={form.age} onChange={e => upd("age", e.target.value)} placeholder="Your age" style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={labelStyle}>Weight</label>
                  <button onClick={() => upd("weightUnit", form.weightUnit === "kg" ? "lbs" : "kg")} style={{ fontSize: 11, color: C.gold, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    {form.weightUnit === "kg" ? "→ lbs" : "→ kg"}
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input type="number" value={form.weight} onChange={e => upd("weight", e.target.value)} placeholder={form.weightUnit === "kg" ? "70" : "154"} style={{ ...inputStyle, paddingRight: 40 }} />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.slate500, fontWeight: 600 }}>{form.weightUnit}</span>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={labelStyle}>Height</label>
                  <button onClick={() => upd("heightUnit", form.heightUnit === "cm" ? "ft" : "cm")} style={{ fontSize: 11, color: C.gold, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    {form.heightUnit === "cm" ? "→ ft" : "→ cm"}
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input type="number" value={form.height} onChange={e => upd("height", e.target.value)} placeholder={form.heightUnit === "cm" ? "175" : "5.7"} style={{ ...inputStyle, paddingRight: 40 }} />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.slate500, fontWeight: 600 }}>{form.heightUnit}</span>
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Allergies (optional, comma-separated)</label>
              <input value={form.allergies.join(", ")} onChange={e => upd("allergies", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="e.g. nuts, shellfish, eggs" style={inputStyle} />
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div>
          <h2 style={stepTitle}>Dietary Preferences</h2>
          <p style={stepSub}>Select all that apply</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {diets.map(d => {
              const sel = form.dietary_preferences.includes(d.id);
              return (
                <button key={d.id} onClick={() => toggleDiet(d.id)} style={{
                  background: sel ? C.goldFaint : C.white, border: `2px solid ${sel ? C.gold : C.slate100}`,
                  borderRadius: 14, padding: "14px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, position: "relative", transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: 22 }}>{d.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: sel ? C.goldDark : C.slate700 }}>{d.label}</span>
                  {sel && <span style={{ position: "absolute", top: 6, right: 8, width: 18, height: 18, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.white }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      );
      case 5: return (
        <div>
          <h2 style={stepTitle}>Customize Your Plan</h2>
          <p style={stepSub}>Add snacks and workout meals</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { key: "include_snacks", icon: "🍎", title: "Include Snacks", desc: "Add healthy snacks to your day", extra: form.include_snacks && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.slate100}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: C.slate600 }}>
                    <span>Number of snacks</span><span style={{ fontWeight: 700, color: C.gold }}>{form.snack_count}</span>
                  </div>
                  <input type="range" min={1} max={4} value={form.snack_count} onChange={e => upd("snack_count", +e.target.value)} style={{ width: "100%", accentColor: C.gold }} />
                </div>
              )},
              { key: "include_pre_workout", icon: "⚡", title: "Pre-Workout Meal", desc: "Fuel up before training" },
              { key: "include_post_workout", icon: "💪", title: "Post-Workout Meal", desc: "Recover and rebuild" },
            ].map(opt => (
              <Card key={opt.key} style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 26 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.slate800 }}>{opt.title}</div>
                      <div style={{ fontSize: 12, color: C.slate500 }}>{opt.desc}</div>
                    </div>
                  </div>
                  <div onClick={() => upd(opt.key, !form[opt.key])} style={{
                    width: 44, height: 26, borderRadius: 13, background: form[opt.key] ? C.gold : C.slate200,
                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                  }}>
                    <div style={{
                      position: "absolute", top: 3, left: form[opt.key] ? 21 : 3, width: 20, height: 20,
                      background: C.white, borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    }} />
                  </div>
                </div>
                {opt.extra}
              </Card>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.cream}, ${C.creamDark})`, padding: "0 20px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 40, paddingBottom: 40 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: C.white, padding: "8px 18px", borderRadius: 30, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
            <div style={{ width: 30, height: 30, background: grad, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✨</div>
            <span style={{ fontWeight: 800, color: C.slate800, fontSize: 18 }}>NutriAI</span>
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 5, borderRadius: 99, background: i < step ? C.gold : C.slate200, transition: "background 0.3s" }} />
          ))}
        </div>

        {/* Card */}
        <Card style={{ padding: 32, marginBottom: 20 }}>
          {renderStep()}
        </Card>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 12 }}>
          {step > 1 && <Btn onClick={() => setStep(s => s - 1)} variant="outline" style={{ flex: 1 }}>← Back</Btn>}
          {step < TOTAL
            ? <Btn onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{ flex: 1 }}>Continue →</Btn>
            : <Btn onClick={() => onComplete(form)} style={{ flex: 1 }}>✨ Start My Journey</Btn>
          }
        </div>
      </div>
    </div>
  );
}

const mealConfigs = {
  breakfast:    { emoji: "🌅", label: "Breakfast",    grad: `linear-gradient(135deg, #F97316, #F59E0B)` },
  lunch:        { emoji: "☀️",  label: "Lunch",        grad: `linear-gradient(135deg, #10B981, #14B8A6)` },
  dinner:       { emoji: "🌙", label: "Dinner",       grad: `linear-gradient(135deg, #6366F1, #8B5CF6)` },
  snack:        { emoji: "🍎", label: "Snack",        grad: `linear-gradient(135deg, #F43F5E, #EC4899)` },
  pre_workout:  { emoji: "⚡", label: "Pre-Workout",  grad: `linear-gradient(135deg, #3B82F6, #06B6D4)` },
  post_workout: { emoji: "💪", label: "Post-Workout", grad: `linear-gradient(135deg, #8B5CF6, #A855F7)` },
};

// Strip measurements, quantities, and cooking prep notes from ingredient strings
// e.g. "2 tablespoons almond butter"     → "almond butter"
// e.g. "1/2 cup rolled oats"             → "rolled oats"
// e.g. "avocado, sliced"                 → "avocado"
// e.g. "sweet potato, cubed"             → "sweet potato"
// e.g. "salt and pepper to taste"        → "salt"  (and pepper is a separate search)
// e.g. "1 can chickpeas, drained"        → "chickpeas"
function extractIngredientName(raw) {
  let s = raw.trim();

  // Remove leading numbers and fractions (e.g. "2", "1/2", "1.5", "2-3")
  s = s.replace(/^\d[\d\s\/\.\-]*/, "").trim();

  // Remove common measurement units at the start
  const units = [
    "tablespoons?","tbsp\\.?","teaspoons?","tsp\\.?","cups?","fluid ounces?","fl\\.? ?oz\\.?",
    "ounces?","oz\\.?","pounds?","lbs?\\.?","lb\\.?","grams?","g\\.?","kg\\.?","kilograms?",
    "ml\\.?","milliliters?","liters?","l\\.?","handfuls?","pieces?","cloves?","sprigs?",
    "stalks?","heads?","cans?","tins?","jars?","packages?","pkg\\.?","bags?","bunches?",
    "slices?","pinch(?:es)?","dash(?:es)?","drops?","wedges?","sheets?","strips?","blocks?",
    "medium","large","small","extra-?large",
  ];
  const unitPattern = new RegExp(`^(?:${units.join("|")})(?:\\s+of)?\\s+`, "i");
  s = s.replace(unitPattern, "").trim();
  // Run twice to catch "2 tablespoons of" where "of" stays after first pass
  s = s.replace(unitPattern, "").trim();
  s = s.replace(/^of\s+/i, "").trim();

  // Remove anything after a comma (prep notes like ", sliced", ", diced", ", to taste")
  s = s.replace(/,.*$/, "").trim();

  // Remove trailing prep/cooking descriptors after the core ingredient name
  const prepWords = [
    "sliced","diced","chopped","minced","grated","shredded","peeled","cubed","mashed",
    "crushed","julienned","halved","quartered","torn","crumbled","softened","melted",
    "beaten","whisked","sifted","toasted","roasted","cooked","uncooked","raw","frozen",
    "thawed","drained","rinsed","patted dry","room temperature","at room temperature",
    "to taste","as needed","optional","fresh","dried","ground","whole","boneless",
    "skinless","pitted","seeded","deveined","trimmed","hulled","zested","juiced",
  ];
  const prepPattern = new RegExp(`\\s+(?:${prepWords.join("|")})(?:\\s+.*)?$`, "i");
  s = s.replace(prepPattern, "").trim();

  // Remove anything in parentheses
  s = s.replace(/\(.*?\)/g, "").trim();

  // Remove trailing punctuation
  s = s.replace(/[,;:\-–\.]+$/, "").trim();

  return s || raw.trim();
}

// ── NL Grocery stores ─────────────────────────────────────────────────────────
const NL_STORES = [
  {
    id: "ah",
    name: "Albert Heijn",
    color: "#00A0E2",
    textColor: "#fff",
    logo: "🔵",
    tagline: "Largest NL chain · Online delivery",
    searchUrl: (q) => `https://www.ah.nl/zoeken?query=${encodeURIComponent(q)}`,
    webOnly: false,
  },
  {
    id: "jumbo",
    name: "Jumbo",
    color: "#FFD700",
    textColor: "#333",
    logo: "🟡",
    tagline: "2nd largest NL chain · Online delivery",
    searchUrl: (q) => `https://www.jumbo.com/producten/?searchType=keyword&searchTerms=${encodeURIComponent(q)}`,
    webOnly: false,
  },

  {
    id: "picnic",
    name: "Picnic",
    color: "#00C896",
    textColor: "#fff",
    logo: "🟢",
    tagline: "Free home delivery · App only",
    searchUrl: () => `https://picnic.app/nl/assortiment/`,
    webOnly: true, // Picnic has no web search — app only
  },
];

// ── Store Picker Sheet ─────────────────────────────────────────────────────────
function StorePickerSheet({ ingredients, mealName, onClose }) {
  const [selectedStore, setSelectedStore] = useState(null);
  const [step, setStep] = useState("pick"); // "pick" | "shop"
  const [checkedItems, setCheckedItems] = useState({});

  // Clean ingredient names once
  const cleanedIngredients = (ingredients || []).map(ing => ({
    raw: ing,
    name: extractIngredientName(ing),
  }));

  const toggleCheck = (i) => setCheckedItems(p => ({ ...p, [i]: !p[i] }));
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const openSearch = (name) => {
    window.open(selectedStore.searchUrl(name), "_blank");
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100,
        animation: "fadeIn 0.15s ease",
      }} />
      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
        background: C.white, borderRadius: "24px 24px 0 0",
        padding: "0 0 40px", maxHeight: "88vh", overflowY: "auto",
        animation: "slideUp 0.25s ease",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
        </div>

        {/* ── STEP 1: Pick store ── */}
        {step === "pick" && (
          <div style={{ padding: "8px 20px 0" }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: C.slate900, marginBottom: 4 }}>
              🛒 Order My Ingredients
            </div>
            <div style={{ fontSize: 14, color: C.slate500, marginBottom: 20 }}>
              {cleanedIngredients.length} ingredients for <strong>{mealName}</strong>
            </div>

            <div style={{ fontWeight: 700, fontSize: 14, color: C.slate700, marginBottom: 12 }}>
              Choose your store
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {NL_STORES.map(store => (
                <button key={store.id} onClick={() => { setSelectedStore(store); setStep("shop"); }} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px", borderRadius: 16, border: `1.5px solid ${C.slate100}`,
                  background: C.white, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", textAlign: "left",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = store.color; e.currentTarget.style.background = C.slate50; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.slate100; e.currentTarget.style.background = C.white; }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: store.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {store.logo}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.slate900 }}>{store.name}</div>
                    <div style={{ fontSize: 12, color: C.slate500 }}>{store.tagline}</div>
                  </div>
                  <div style={{ fontSize: 18, color: C.slate400 }}>›</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 18, padding: "12px 16px", borderRadius: 12, background: C.goldFaint, border: `1px solid ${C.goldLight}` }}>
              <div style={{ fontSize: 12, color: C.goldDark, fontWeight: 600, marginBottom: 3 }}>Coming soon — Direct cart fill</div>
              <div style={{ fontSize: 12, color: C.slate600, lineHeight: 1.5 }}>
                All ingredients will be added to your cart in one tap. For now, tap each ingredient to search it.
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Shopping list with per-item search links ── */}
        {step === "shop" && selectedStore && (
          <div style={{ padding: "8px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <button onClick={() => setStep("pick")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.slate500, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                ←
              </button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: selectedStore.color, borderRadius: 14 }}>
                <span style={{ fontSize: 20 }}>{selectedStore.logo}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: selectedStore.textColor }}>{selectedStore.name}</div>
                  <div style={{ fontSize: 11, color: selectedStore.textColor, opacity: 0.8 }}>{selectedStore.tagline}</div>
                </div>
              </div>
            </div>

            {/* Store doesn't support online grocery search */}
            {selectedStore.webOnly ? (
              <div>
                <div style={{ background: "#EFF6FF", border: `1.5px solid #93C5FD`, borderRadius: 16, padding: "18px 18px", marginBottom: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{selectedStore.id === "picnic" ? "📱" : "🏪"}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1E40AF", marginBottom: 6 }}>
                    {selectedStore.id === "picnic" ? "Picnic is app-only" : "Lidl doesn't sell groceries online"}
                  </div>
                  <div style={{ fontSize: 13, color: "#1D4ED8", lineHeight: 1.6, marginBottom: 14 }}>
                    {selectedStore.id === "picnic"
                      ? "Picnic has no website search. Open the Picnic app on your phone and search for these ingredients manually."
                      : "Lidl Netherlands only sells promotions and non-food items online. Use this list to shop in-store at your nearest Lidl."}
                  </div>
                  <button onClick={() => window.open(selectedStore.searchUrl(), "_blank")} style={{
                    padding: "10px 20px", borderRadius: 12, background: selectedStore.color,
                    border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                    fontSize: 14, color: selectedStore.textColor,
                  }}>
                    {selectedStore.id === "picnic" ? "Open Picnic website →" : "Open Lidl website →"}
                  </button>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.slate700, marginBottom: 10 }}>Your shopping list:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {cleanedIngredients.map((ing, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.white, border: `1px solid ${C.slate100}`, borderRadius: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: selectedStore.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.slate800 }}>{ing.name}</div>
                        {ing.raw !== ing.name && <div style={{ fontSize: 11, color: C.slate400 }}>{ing.raw}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.slate800 }}>Your ingredients</div>
                  <div style={{ fontSize: 12, color: C.slate500 }}>{checkedCount}/{cleanedIngredients.length} added</div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, background: C.slate100, borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: C.emerald, borderRadius: 2, width: `${cleanedIngredients.length > 0 ? (checkedCount / cleanedIngredients.length) * 100 : 0}%`, transition: "width 0.3s" }} />
                </div>

                <div style={{ fontSize: 13, color: C.slate500, marginBottom: 14, lineHeight: 1.5, background: C.slate50, borderRadius: 10, padding: "10px 12px" }}>
                  💡 Tap <strong>Search →</strong> on each ingredient to find it on {selectedStore.name}. Check it off once it's in your cart.
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {cleanedIngredients.map((ing, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 14px", borderRadius: 14,
                      background: checkedItems[i] ? "#F0FDF4" : C.white,
                      border: `1.5px solid ${checkedItems[i] ? C.emerald : C.slate100}`,
                      transition: "all 0.2s",
                    }}>
                      <div onClick={() => toggleCheck(i)} style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                        background: checkedItems[i] ? C.emerald : C.white,
                        border: `2px solid ${checkedItems[i] ? C.emerald : C.slate300}`,
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                      }}>
                        {checkedItems[i] && <span style={{ color: C.white, fontSize: 13, fontWeight: 800 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: checkedItems[i] ? C.slate400 : C.slate800, textDecoration: checkedItems[i] ? "line-through" : "none" }}>
                          {ing.name}
                        </div>
                        {ing.raw !== ing.name && (
                          <div style={{ fontSize: 11, color: C.slate400, marginTop: 1 }}>{ing.raw}</div>
                        )}
                      </div>
                      <button onClick={() => { openSearch(ing.name); if (!checkedItems[i]) toggleCheck(i); }} style={{
                        flexShrink: 0, padding: "6px 12px", borderRadius: 10, border: "none",
                        cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 12,
                        whiteSpace: "nowrap", transition: "all 0.2s",
                        background: checkedItems[i] ? C.slate100 : selectedStore.color,
                        color: checkedItems[i] ? C.slate400 : selectedStore.textColor,
                      }}>
                        Search →
                      </button>
                    </div>
                  ))}
                </div>

                {checkedCount === cleanedIngredients.length && cleanedIngredients.length > 0 && (
                  <div style={{ background: "#F0FDF4", border: `1.5px solid ${C.emerald}`, borderRadius: 16, padding: "16px 18px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#166534", marginBottom: 4 }}>All ingredients searched!</div>
                    <div style={{ fontSize: 13, color: "#15803D" }}>Head to your cart on {selectedStore.name} to complete your order.</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Meal Detail Page ──────────────────────────────────────────────────────────
function MealDetailPage({ meal, mealType, onBack, onRegenerate, isRegenerating }) {
  const cfg = mealConfigs[mealType] || mealConfigs.breakfast;
  const rt = meal.recommended_time;
  const [showStorePicker, setShowStorePicker] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: C.slate50, animation: "fadeIn 0.2s ease" }}>
      {/* Store picker sheet */}
      {showStorePicker && (
        <StorePickerSheet
          ingredients={meal.ingredients}
          mealName={meal.name}
          onClose={() => setShowStorePicker(false)}
        />
      )}

      {/* Hero header */}
      <div style={{ background: cfg.grad, padding: "0 0 32px", position: "relative" }}>
        <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,0.2)", border: "none", color: C.white,
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14,
          }}>
            ← Back
          </button>
          <button onClick={onRegenerate} disabled={isRegenerating} style={{
            background: "rgba(255,255,255,0.2)", border: "none", color: C.white,
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13,
            opacity: isRegenerating ? 0.6 : 1,
          }}>
            {isRegenerating ? <><Spinner size={13} color={C.white} /> Regenerating…</> : "🔄 Regenerate"}
          </button>
        </div>

        <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>{cfg.emoji}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{cfg.label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.white, lineHeight: 1.2, letterSpacing: -0.5 }}>{meal.name}</div>
          {meal.prep_time && (
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.15)", borderRadius: 20, padding: "5px 14px" }}>
              <span style={{ fontSize: 13 }}>⏱</span>
              <span style={{ fontSize: 13, color: C.white, fontWeight: 600 }}>{meal.prep_time} prep</span>
            </div>
          )}
        </div>

        {rt?.time && (
          <div style={{ margin: "18px 20px 0", background: "rgba(0,0,0,0.18)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🕐</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.white }}>Eat at {rt.time}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2, lineHeight: 1.4 }}>{rt.reason}</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px 40px", maxWidth: 640, margin: "0 auto" }}>

        {/* Macros */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, margin: "20px 0" }}>
          {[
            { label: "Calories", value: meal.calories || 0, unit: "kcal", color: "#F97316" },
            { label: "Protein",  value: meal.protein  || 0, unit: "g",    color: C.emerald },
            { label: "Carbs",    value: meal.carbs    || 0, unit: "g",    color: C.amber },
            { label: "Fat",      value: meal.fat      || 0, unit: "g",    color: C.purple },
          ].map(m => (
            <div key={m.label} style={{ background: C.white, borderRadius: 16, padding: "14px 8px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: C.slate500, fontWeight: 600 }}>{m.unit}</div>
              <div style={{ fontSize: 11, color: C.slate400, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {meal.description && (
          <div style={{ background: C.white, borderRadius: 18, padding: "18px 20px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: C.slate800 }}>Why this meal?</span>
            </div>
            <p style={{ fontSize: 14, color: C.slate600, lineHeight: 1.7, margin: 0 }}>{meal.description}</p>
          </div>
        )}

        {/* Ingredients */}
        {meal.ingredients?.length > 0 && (
          <div style={{ background: C.white, borderRadius: 18, padding: "18px 20px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>🛒</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: C.slate800 }}>Ingredients</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: C.slate400, fontWeight: 600 }}>{meal.ingredients.length} items</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {meal.ingredients.map((ing, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", background: C.slate50, borderRadius: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.emerald, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: C.slate700 }}>{ing}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {meal.instructions?.length > 0 && (
          <div style={{ background: C.white, borderRadius: 18, padding: "18px 20px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>👨‍🍳</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: C.slate800 }}>How to make it</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: C.slate400, fontWeight: 600 }}>{meal.instructions.length} steps</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {meal.instructions.map((inst, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
                    background: cfg.grad, color: C.white, display: "flex",
                    alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13,
                  }}>{i + 1}</div>
                  <p style={{ fontSize: 14, color: C.slate700, lineHeight: 1.6, margin: "4px 0 0" }}>{inst}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order My Ingredients CTA */}
        {meal.ingredients?.length > 0 && (
          <button
            onClick={() => setShowStorePicker(true)}
            style={{
              width: "100%", height: 60, borderRadius: 20, border: "none",
              background: grad, cursor: "pointer", fontFamily: "inherit",
              fontWeight: 800, fontSize: 17, color: C.white,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: `0 6px 24px ${C.gold}55`,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 10px 32px ${C.gold}77`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 6px 24px ${C.gold}55`; }}
          >
            🛒 Order My Ingredients
          </button>
        )}
      </div>
    </div>
  );
}

// ── Meal Card (clickable summary) ─────────────────────────────────────────────
function MealCard({ meal, mealType, onRegenerate, isRegenerating, recommendedTime, onClick }) {
  if (!meal) return null;
  const cfg = mealConfigs[mealType] || mealConfigs.breakfast;

  return (
    <div onClick={onClick} style={{ marginBottom: 14, cursor: "pointer", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", transition: "transform 0.15s, box-shadow 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}
    >
      {/* Coloured header */}
      <div style={{ background: cfg.grad, padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ fontSize: 24 }}>{cfg.emoji}</span>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{cfg.label}</div>
              <div style={{ fontSize: 16, color: C.white, fontWeight: 700 }}>{meal.name}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {meal.prep_time && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", color: C.white, padding: "3px 9px", borderRadius: 20, fontWeight: 600 }}>⏱ {meal.prep_time}</span>}
            <button
              onClick={e => { e.stopPropagation(); onRegenerate(); }}
              disabled={isRegenerating}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", color: C.white, width: 32, height: 32, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}
            >
              {isRegenerating ? <Spinner size={13} color={C.white} /> : "🔄"}
            </button>
            <div style={{ background: "rgba(255,255,255,0.2)", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.white }}>›</div>
          </div>
        </div>
        {recommendedTime?.time && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 7, background: "rgba(0,0,0,0.15)", borderRadius: 9, padding: "6px 11px" }}>
            <span style={{ fontSize: 13 }}>🕐</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>Eat at: {recommendedTime.time}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>— {recommendedTime.reason}</span>
          </div>
        )}
      </div>
      {/* Macro strip */}
      <div style={{ background: C.white, padding: "12px 18px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        {[
          { label: "kcal", value: meal.calories || 0, color: "#F97316" },
          { label: "Protein", value: `${meal.protein || 0}g`, color: C.emerald },
          { label: "Carbs", value: `${meal.carbs || 0}g`, color: C.amber },
          { label: "Fat", value: `${meal.fat || 0}g`, color: C.purple },
        ].map(m => (
          <div key={m.label} style={{ textAlign: "center", background: C.slate50, borderRadius: 10, padding: "8px 4px" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 10, color: C.slate400, marginTop: 1 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dashboard
function Dashboard({ profile, setProfile, onLogout }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [generating, setGenerating] = useState(false);
  const [regenMeal, setRegenMeal] = useState(null);
  const [activeTab, setActiveTab] = useState("plan");
  const [activeMeal, setActiveMeal] = useState(null); // { meal, mealType }

  const dateKey = (d) => d.toISOString().split("T")[0];

  // Always read meal plan fresh from localStorage — never stale state
  const getMealPlan = () => store.get(`mealplan_${dateKey(selectedDate)}`);
  const [mealPlan, setMealPlanState] = useState(() => getMealPlan());

  // Sync whenever date changes or tab switches back to plan
  useEffect(() => {
    setMealPlanState(getMealPlan());
  }, [selectedDate, activeTab]);

  // Always write to both state AND localStorage together
  const saveMealPlan = (plan) => {
    store.set(`mealplan_${dateKey(selectedDate)}`, plan);
    const hist = store.get("plan_history") || [];
    store.set("plan_history", [plan, ...hist.filter(h => h.date !== plan.date)].slice(0, 30));
    setMealPlanState(plan);
  };

  // Accepts optional profileOverride so ProfileEditor can trigger regen with freshly-saved profile
  const generatePlan = async (profileOverride) => {
    setGenerating(true);
    try {
      const p = profileOverride || profile;
      const system = "You are a professional nutritionist and sports dietitian. Respond ONLY with valid JSON, no markdown, no explanation.";

      // Get ALL training sessions for the selected day (support multiple per day)
      const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
      const trainingSessions = (p.training_schedule?.[dayName] || []).filter(s => s.startTime && s.endTime);
      const hasTraining = trainingSessions.length > 0;
      const sessionCount = trainingSessions.length;

      const trainingInfo = hasTraining
        ? `- Training sessions today (${dayName}): ${sessionCount} session${sessionCount > 1 ? "s" : ""}
${trainingSessions.map((s, i) => `  Session ${i + 1}: ${s.startTime} – ${s.endTime}`).join("\n")}`
        : "- No training scheduled today (rest day)";

      const multiSessionNote = sessionCount > 1 ? `
MULTIPLE TRAINING SESSIONS (${sessionCount} today):
- This is a high-demand day. Significantly increase total calories and protein to fuel and recover from ALL sessions.
- Add extra pre- and post-workout nutrition for each session. Use the "snacks" array to add fuel between sessions if needed.
- Each training block needs its own pre-workout fuel window (1.5–2h before) and post-workout recovery window (20–45 min after).
- Clearly label which session each snack/meal is supporting in its "reason" field.` : "";

      const timingInstructions = hasTraining ? `
MEAL TIMING — calculate exact clock times based on the actual session times above:
${trainingSessions.map((s, i) => `  Session ${i + 1} (${s.startTime}–${s.endTime}):
    • Pre-workout fuel: 1.5–2 hours before ${s.startTime}
    • Post-workout recovery: 20–45 minutes after ${s.endTime}`).join("\n")}

For EVERY meal/snack include a "recommended_time" object:
  "time": exact clock time like "4:00 PM"
  "reason": one sentence why — mention which session it relates to if relevant
General rules:
  • Breakfast: 7:00–8:00 AM (adjust if first session is early morning)
  • Lunch: midday — push earlier or lighten if it falls within 1.5h of a session
  • Dinner: 1–1.5h after the LAST session ends
  • Snacks: space around sessions, never within 1h before any session starts
${multiSessionNote}` : "";

      const prompt = `Create a personalized daily meal plan for:
- Goal: ${p.goal?.replace(/_/g, " ")}
- Activity: ${p.activity_level?.replace(/_/g, " ")}
- Age: ${p.age}, Weight: ${p.weight}${p.weightUnit}, Height: ${p.height}${p.heightUnit}
- Diet: ${p.dietary_preferences?.join(", ") || "none"}
- Allergies: ${p.allergies?.join(", ") || "none"}
- Include snacks: ${p.include_snacks ? `yes, ${p.snack_count} snacks (add more if multiple training sessions require it)` : "no (but add extra snacks between sessions if there are multiple training sessions)"}
- Include pre-workout meal: ${p.include_pre_workout ? "yes" : "no"}
- Include post-workout meal: ${p.include_post_workout ? "yes" : "no"}
${trainingInfo}
${timingInstructions}

Return JSON with this exact structure${hasTraining ? ' — include "recommended_time" on every meal and snack' : ''}:
{
  "breakfast": {"name":"","description":"","calories":0,"protein":0,"carbs":0,"fat":0,"prep_time":"","ingredients":[],"instructions":[]${hasTraining ? ',"recommended_time":{"time":"","reason":""}' : ''}},
  "lunch": {"name":"","description":"","calories":0,"protein":0,"carbs":0,"fat":0,"prep_time":"","ingredients":[],"instructions":[]${hasTraining ? ',"recommended_time":{"time":"","reason":""}' : ''}},
  "dinner": {"name":"","description":"","calories":0,"protein":0,"carbs":0,"fat":0,"prep_time":"","ingredients":[],"instructions":[]${hasTraining ? ',"recommended_time":{"time":"","reason":""}' : ''}},
  "snacks": [{"name":"","description":"","calories":0,"protein":0,"carbs":0,"fat":0${hasTraining ? ',"recommended_time":{"time":"","reason":""}' : ''}}],
  "pre_workout": {"name":"","description":"","calories":0,"protein":0,"carbs":0,"fat":0,"prep_time":"","ingredients":[],"instructions":[]${hasTraining ? ',"recommended_time":{"time":"","reason":""}' : ''}},
  "post_workout": {"name":"","description":"","calories":0,"protein":0,"carbs":0,"fat":0,"prep_time":"","ingredients":[],"instructions":[]${hasTraining ? ',"recommended_time":{"time":"","reason":""}' : ''}}
}
Only include snacks/pre_workout/post_workout sections if requested or if multiple sessions make extra fuel necessary. Make every meal delicious, practical, and fully aligned with training demands.`;

      const data = await callClaudeJSON(system, prompt, 3000);

      const plan = {
        ...data,
        date: dateKey(selectedDate),
        calories: Math.round((data.breakfast?.calories||0)+(data.lunch?.calories||0)+(data.dinner?.calories||0)+(data.snacks||[]).reduce((s,x)=>s+(x.calories||0),0)+(data.pre_workout?.calories||0)+(data.post_workout?.calories||0)),
        protein: Math.round((data.breakfast?.protein||0)+(data.lunch?.protein||0)+(data.dinner?.protein||0)+(data.snacks||[]).reduce((s,x)=>s+(x.protein||0),0)+(data.pre_workout?.protein||0)+(data.post_workout?.protein||0)),
        carbs: Math.round((data.breakfast?.carbs||0)+(data.lunch?.carbs||0)+(data.dinner?.carbs||0)+(data.snacks||[]).reduce((s,x)=>s+(x.carbs||0),0)+(data.pre_workout?.carbs||0)+(data.post_workout?.carbs||0)),
        fat: Math.round((data.breakfast?.fat||0)+(data.lunch?.fat||0)+(data.dinner?.fat||0)+(data.snacks||[]).reduce((s,x)=>s+(x.fat||0),0)+(data.pre_workout?.fat||0)+(data.post_workout?.fat||0)),
      };
      saveMealPlan(plan);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const regenSingleMeal = async (mealType) => {
    if (!mealPlan) return;
    setRegenMeal(mealType);
    try {
      const system = "You are a sports nutritionist. Respond ONLY with valid JSON.";
      const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
      const trainingSessions = profile.training_schedule?.[dayName] || [];
      const hasTraining = trainingSessions.length > 0 && trainingSessions.some(s => s.startTime);
      const trainingNote = hasTraining
        ? `Training today: ${trainingSessions.map(s => `${s.startTime}–${s.endTime}`).join(", ")}. Include a "recommended_time": {"time":"<exact clock time>","reason":"<one sentence why>"} based on sports nutrition timing principles.`
        : "";
      const prompt = `Create a new ${mealType.replace("_", " ")} meal for someone with:
- Goal: ${profile.goal?.replace(/_/g, " ")}, Diet: ${profile.dietary_preferences?.join(", ") || "none"}, Allergies: ${profile.allergies?.join(", ") || "none"}
${trainingNote}
Return JSON: {"name":"","description":"","calories":0,"protein":0,"carbs":0,"fat":0,"prep_time":"","ingredients":[],"instructions":[],"recommended_time":{"time":"","reason":""}}`;
      const meal = await callClaudeJSON(system, prompt, 800);
      // Clean up empty recommended_time if no training
      if (!hasTraining) delete meal.recommended_time;
      const updated = { ...mealPlan, [mealType]: meal };
      const fields = ["breakfast", "lunch", "dinner"];
      updated.calories = fields.reduce((s, k) => s + (updated[k]?.calories || 0), 0) + (updated.snacks || []).reduce((s, x) => s + (x.calories || 0), 0);
      updated.protein = fields.reduce((s, k) => s + (updated[k]?.protein || 0), 0) + (updated.snacks || []).reduce((s, x) => s + (x.protein || 0), 0);
      updated.carbs = fields.reduce((s, k) => s + (updated[k]?.carbs || 0), 0) + (updated.snacks || []).reduce((s, x) => s + (x.carbs || 0), 0);
      updated.fat = fields.reduce((s, k) => s + (updated[k]?.fat || 0), 0) + (updated.snacks || []).reduce((s, x) => s + (x.fat || 0), 0);
      saveMealPlan(updated);
    } catch (e) { console.error(e); }
    finally { setRegenMeal(null); }
  };

  // Week calendar
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 3 + i); return d;
  });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const isSame = (a, b) => dateKey(a) === dateKey(b);

  const tabs = [
    { id: "plan", label: "Dashboard", icon: "🏠" },
    { id: "profile", label: "My Profile", icon: "👤" },
    { id: "progress", label: "Progress", icon: "📈" },
    { id: "macros", label: "My Nutrition", icon: "📊" },
    { id: "shopping", label: "Shopping", icon: "🛒" },
    { id: "water", label: "Water", icon: "💧" },
    { id: "chat", label: "AI Chat", icon: "🤖" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.slate50, fontFamily: "Georgia, serif" }}>

      {/* ── Persistent Sidebar ── */}
      <div style={{
        width: 220, flexShrink: 0, background: C.white,
        borderRight: `1px solid ${C.slate100}`,
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${C.slate100}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: grad, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 4px 12px ${C.gold}40` }}>✨</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.slate900, lineHeight: 1.2 }}>NutriAI</div>
              <div style={{ fontSize: 11, color: C.slate400, fontWeight: 500, textTransform: "capitalize" }}>
                {profile.subscription_tier || "Free"}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {tabs.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: 12, border: "none", cursor: "pointer",
                background: isActive ? grad : "transparent",
                marginBottom: 2, transition: "all 0.15s", textAlign: "left", fontFamily: "inherit",
              }}>
                <span style={{ fontSize: 17, width: 22, textAlign: "center" }}>{t.icon}</span>
                <span style={{ fontWeight: isActive ? 700 : 500, fontSize: 14, color: isActive ? C.white : C.slate600 }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div style={{ padding: "16px 14px", borderTop: `1px solid ${C.slate100}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.slate50, borderRadius: 12 }}>
            <div style={{ width: 34, height: 34, background: grad, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: C.white, flexShrink: 0 }}>
              {profile.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.slate800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.full_name || "User"}</div>
              <div style={{ fontSize: 11, color: C.slate500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.goal?.replace(/_/g, " ") || ""}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", position: "relative" }}>

        {/* Meal Detail Page — full overlay inside main area */}
        {activeMeal && (
          <MealDetailPage
            meal={activeMeal.meal}
            mealType={activeMeal.mealType}
            onBack={() => setActiveMeal(null)}
            onRegenerate={() => { regenSingleMeal(activeMeal.mealType); setActiveMeal(null); }}
            isRegenerating={regenMeal === activeMeal.mealType}
          />
        )}

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px 80px", display: activeMeal ? "none" : "block" }}>

        {activeTab === "plan" && (
          <>
            {/* Greeting */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 26, color: C.slate900, margin: "0 0 4px", letterSpacing: -0.5 }}>
                Hello, {profile.full_name?.split(" ")[0] || "there"}! 👋
              </h2>
              <p style={{ fontSize: 14, color: C.slate500, margin: 0 }}>Your personalized meal plan</p>
            </div>
            {/* Week Calendar */}
            <Card style={{ padding: "16px 14px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.slate700, marginBottom: 12 }}>Select Date</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {weekDates.map(d => {
                  const sel = isSame(d, selectedDate);
                  const tod = isSame(d, today);
                  return (
                    <button key={d.toISOString()} onClick={() => setSelectedDate(d)} style={{
                      background: sel ? grad : C.slate50, border: "none", borderRadius: 12, padding: "10px 4px",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative",
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: sel ? "rgba(255,255,255,0.8)" : C.slate500 }}>{dayNames[d.getDay()]}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: sel ? C.white : C.slate800 }}>{d.getDate()}</span>
                      {tod && !sel && <div style={{ width: 5, height: 5, background: C.gold, borderRadius: "50%", position: "absolute", bottom: 4 }} />}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Daily Summary */}
            {mealPlan && (
              <Card style={{ padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.slate800, marginBottom: 14 }}>Daily Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {[
                    { label: "kcal", value: mealPlan.calories || 0, icon: "🔥", color: "#F97316", bg: "#FFF7ED" },
                    { label: "Protein", value: `${mealPlan.protein || 0}g`, icon: "🥩", color: C.emerald, bg: "#F0FDF4" },
                    { label: "Carbs", value: `${mealPlan.carbs || 0}g`, icon: "🌾", color: C.amber, bg: "#FFFBEB" },
                    { label: "Fat", value: `${mealPlan.fat || 0}g`, icon: "💧", color: C.purple, bg: "#FAF5FF" },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: C.slate500 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Generate Button */}
            <div style={{ marginBottom: 16 }}>
              <Btn onClick={generatePlan} disabled={generating} style={{ width: "100%", height: 52, fontSize: 15, borderRadius: 16 }}>
                {generating ? <><Spinner size={18} color={C.white} /> Generating your plan...</> : mealPlan ? "🔄 Regenerate Plan" : "✨ Generate My Meal Plan"}
              </Btn>
            </div>

            {/* Generating animation */}
            {generating && (
              <Card style={{ padding: "32px 24px", textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🧑‍🍳</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.slate800, marginBottom: 6 }}>Creating Your Perfect Menu</div>
                <div style={{ fontSize: 13, color: C.slate500 }}>Claude AI is crafting personalized meals just for you...</div>
              </Card>
            )}

            {/* Meal Cards */}
            {mealPlan && !generating && (
              <>
                {mealPlan.pre_workout && <MealCard meal={mealPlan.pre_workout} mealType="pre_workout" onRegenerate={() => regenSingleMeal("pre_workout")} isRegenerating={regenMeal === "pre_workout"} recommendedTime={mealPlan.pre_workout?.recommended_time?.time ? mealPlan.pre_workout.recommended_time : null} onClick={() => setActiveMeal({ meal: mealPlan.pre_workout, mealType: "pre_workout" })} />}
                <MealCard meal={mealPlan.breakfast} mealType="breakfast" onRegenerate={() => regenSingleMeal("breakfast")} isRegenerating={regenMeal === "breakfast"} recommendedTime={mealPlan.breakfast?.recommended_time?.time ? mealPlan.breakfast.recommended_time : null} onClick={() => setActiveMeal({ meal: mealPlan.breakfast, mealType: "breakfast" })} />
                <MealCard meal={mealPlan.lunch} mealType="lunch" onRegenerate={() => regenSingleMeal("lunch")} isRegenerating={regenMeal === "lunch"} recommendedTime={mealPlan.lunch?.recommended_time?.time ? mealPlan.lunch.recommended_time : null} onClick={() => setActiveMeal({ meal: mealPlan.lunch, mealType: "lunch" })} />
                <MealCard meal={mealPlan.dinner} mealType="dinner" onRegenerate={() => regenSingleMeal("dinner")} isRegenerating={regenMeal === "dinner"} recommendedTime={mealPlan.dinner?.recommended_time?.time ? mealPlan.dinner.recommended_time : null} onClick={() => setActiveMeal({ meal: mealPlan.dinner, mealType: "dinner" })} />
                {mealPlan.post_workout && <MealCard meal={mealPlan.post_workout} mealType="post_workout" onRegenerate={() => regenSingleMeal("post_workout")} isRegenerating={regenMeal === "post_workout"} recommendedTime={mealPlan.post_workout?.recommended_time?.time ? mealPlan.post_workout.recommended_time : null} onClick={() => setActiveMeal({ meal: mealPlan.post_workout, mealType: "post_workout" })} />}
                {mealPlan.snacks?.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.slate700, marginBottom: 10 }}>🍎 Snacks</div>
                    {mealPlan.snacks.map((snack, i) => (
                      <div key={i} onClick={() => setActiveMeal({ meal: snack, mealType: "snack" })}
                        style={{ marginBottom: 10, cursor: "pointer", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", transition: "transform 0.15s, box-shadow 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.07)"; }}
                      >
                        <div style={{ background: `linear-gradient(135deg, #F43F5E, #EC4899)`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 20 }}>🍎</span>
                            <div>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Snack {i + 1}</div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: C.white }}>{snack.name}</div>
                            </div>
                          </div>
                          <div style={{ background: "rgba(255,255,255,0.2)", width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.white }}>›</div>
                        </div>
                        <div style={{ background: C.white, padding: "10px 16px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                          {[
                            { label: "kcal", value: snack.calories || 0, color: "#F97316" },
                            { label: "Protein", value: `${snack.protein || 0}g`, color: C.emerald },
                            { label: "Carbs", value: `${snack.carbs || 0}g`, color: C.amber },
                            { label: "Fat", value: `${snack.fat || 0}g`, color: C.purple },
                          ].map(m => (
                            <div key={m.label} style={{ textAlign: "center", background: C.slate50, borderRadius: 9, padding: "7px 4px" }}>
                              <div style={{ fontWeight: 800, fontSize: 13, color: m.color }}>{m.value}</div>
                              <div style={{ fontSize: 10, color: C.slate400 }}>{m.label}</div>
                            </div>
                          ))}
                        </div>
                        {snack.recommended_time?.time && (
                          <div style={{ background: "#FFF0F3", padding: "7px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12 }}>🕐</span>
                            <span style={{ fontSize: 12, color: "#9D174D", fontWeight: 700 }}>{snack.recommended_time.time}</span>
                            <span style={{ fontSize: 11, color: "#BE185D" }}>— {snack.recommended_time.reason}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!mealPlan && !generating && (
              <Card style={{ padding: "40px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🥗</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: C.slate800, marginBottom: 8 }}>Ready for Your First Meal Plan?</div>
                <div style={{ fontSize: 14, color: C.slate500 }}>Let Claude AI create the perfect nutrition plan based on your goals.</div>
              </Card>
            )}
          </>
        )}

        {activeTab === "shopping" && <ShoppingList mealPlan={mealPlan} profile={profile} />}
        {activeTab === "water" && <WaterTracker />}
        {activeTab === "macros" && <MacroCalculator profile={profile} mealPlan={mealPlan} />}
        {activeTab === "progress" && <Progress />}
        {activeTab === "chat" && <AIChat profile={profile} />}
        {activeTab === "profile" && <ProfileEditor profile={profile} setProfile={setProfile} onLogout={onLogout} selectedDate={selectedDate} onTrainingChanged={(savedProfile) => generatePlan(savedProfile)} />}
        </div>
      </div>
    </div>
  );
}

// Shopping List
function ShoppingList({ mealPlan, profile }) {
  const [list, setList] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [checked, setChecked] = useState({});

  const generate = async () => {
    if (!mealPlan) return;
    setGenerating(true);
    try {
      const meals = [mealPlan.breakfast, mealPlan.lunch, mealPlan.dinner, ...(mealPlan.snacks || [])].filter(Boolean);
      const allIngredients = meals.flatMap(m => m.ingredients || [m.name]);
      const system = "You are a nutritionist. Respond ONLY with valid JSON.";
      const prompt = `Based on these meal ingredients: ${allIngredients.join(", ")}
Create a consolidated shopping list organized by category.
Return JSON: {"categories": [{"name": "Produce", "items": [{"name":"","quantity":"","unit":""}]}]}`;
      const data = await callClaudeJSON(system, prompt, 1000);
      setList(data.categories || []);
      setChecked({});
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  const toggle = (key) => setChecked(p => ({ ...p, [key]: !p[key] }));
  const total = list.reduce((s, c) => s + c.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: C.slate900, margin: 0 }}>Shopping List</h2>
          {total > 0 && <p style={{ fontSize: 13, color: C.slate500, margin: "4px 0 0" }}>{done}/{total} items checked</p>}
        </div>
        <Btn onClick={generate} disabled={generating || !mealPlan} size="sm">
          {generating ? <Spinner size={14} color={C.white} /> : "🛒 Generate"}
        </Btn>
      </div>

      {!mealPlan && (
        <Card style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
          <div style={{ color: C.slate500, fontSize: 14 }}>Generate a meal plan first to create your shopping list.</div>
        </Card>
      )}

      {mealPlan && list.length === 0 && !generating && (
        <Card style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
          <div style={{ color: C.slate500, fontSize: 14, marginBottom: 16 }}>Generate a shopping list from today's meal plan.</div>
          <Btn onClick={generate}>Generate Shopping List</Btn>
        </Card>
      )}

      {generating && (
        <Card style={{ padding: "32px 24px", textAlign: "center" }}>
          <Spinner size={32} />
          <div style={{ color: C.slate500, fontSize: 14, marginTop: 12 }}>Building your shopping list...</div>
        </Card>
      )}

      {list.map(cat => (
        <Card key={cat.name} style={{ padding: "16px 20px", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.slate800, marginBottom: 12 }}>{cat.name}</div>
          {cat.items.map((item, i) => {
            const key = `${cat.name}-${i}`;
            return (
              <div key={key} onClick={() => toggle(key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < cat.items.length - 1 ? `1px solid ${C.slate100}` : "none", cursor: "pointer" }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${checked[key] ? C.gold : C.slate300}`, background: checked[key] ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                  {checked[key] && <span style={{ color: C.white, fontSize: 12, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ flex: 1, fontSize: 14, color: checked[key] ? C.slate400 : C.slate700, textDecoration: checked[key] ? "line-through" : "none", transition: "all 0.2s" }}>{item.name}</span>
                <span style={{ fontSize: 12, color: C.slate500 }}>{item.quantity} {item.unit}</span>
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
}

// Water Tracker
function WaterTracker() {
  const todayKey = new Date().toISOString().split("T")[0];
  const [glasses, setGlasses] = useState(() => store.get(`water_${todayKey}`) || 0);
  const goal = 8;

  const add = () => { const n = Math.min(glasses + 1, 12); setGlasses(n); store.set(`water_${todayKey}`, n); };
  const remove = () => { const n = Math.max(glasses - 1, 0); setGlasses(n); store.set(`water_${todayKey}`, n); };

  const pct = (glasses / goal) * 100;
  const colors = pct < 40 ? "#F97316" : pct < 75 ? C.amber : C.blue;

  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: 22, color: C.slate900, marginBottom: 4 }}>Water Tracker 💧</h2>
      <p style={{ color: C.slate500, fontSize: 14, marginBottom: 20 }}>Stay hydrated throughout the day</p>

      <Card style={{ padding: "32px 24px", textAlign: "center", marginBottom: 16 }}>
        {/* Circular progress */}
        <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 24px" }}>
          <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="80" cy="80" r="68" fill="none" stroke={C.slate100} strokeWidth="12" />
            <circle cx="80" cy="80" r="68" fill="none" stroke={colors} strokeWidth="12" strokeDasharray={`${2 * Math.PI * 68}`} strokeDashoffset={`${2 * Math.PI * 68 * (1 - pct / 100)}`} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: colors }}>{glasses}</div>
            <div style={{ fontSize: 13, color: C.slate500 }}>of {goal} glasses</div>
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: C.slate700, marginBottom: 6 }}>
          {pct >= 100 ? "🎉 Daily goal reached!" : pct >= 75 ? "Almost there! 💪" : pct >= 40 ? "Keep going! 👍" : "Let's hydrate! 💧"}
        </div>
        <div style={{ fontSize: 13, color: C.slate500, marginBottom: 24 }}>
          {glasses * 250}ml of {goal * 250}ml consumed
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <button onClick={remove} style={{ width: 48, height: 48, borderRadius: "50%", background: C.slate100, border: "none", fontSize: 22, cursor: "pointer" }}>−</button>
          <div style={{ fontSize: 26 }}>💧</div>
          <button onClick={add} style={{ width: 48, height: 48, borderRadius: "50%", background: grad, border: "none", fontSize: 22, cursor: "pointer", color: C.white }}>+</button>
        </div>
      </Card>

      {/* Glass grid */}
      <Card style={{ padding: "20px 24px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.slate700, marginBottom: 14 }}>Your progress</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {Array.from({ length: goal }).map((_, i) => (
            <div key={i} onClick={() => { const n = i + 1; setGlasses(n); store.set(`water_${todayKey}`, n); }} style={{
              aspectRatio: "1", borderRadius: 14, background: i < glasses ? "#EFF6FF" : C.slate50,
              border: `2px solid ${i < glasses ? C.blue : C.slate200}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, cursor: "pointer", transition: "all 0.2s",
            }}>
              {i < glasses ? "💧" : "○"}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Macro Calculator
function MacroCalculator({ profile, mealPlan }) {
  const calcTDEE = () => {
    if (!profile.weight || !profile.height || !profile.age) return 0;
    const w = profile.weightUnit === "lbs" ? +profile.weight * 0.453592 : +profile.weight;
    const h = profile.heightUnit === "ft" ? +profile.height * 30.48 : +profile.height;
    const bmr = 10 * w + 6.25 * h - 5 * +profile.age + 5;
    const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    return Math.round(bmr * (multipliers[profile.activity_level] || 1.2));
  };

  const tdee = calcTDEE();
  const goalCalories = {
    lose_weight: Math.round(tdee * 0.8),
    lose_weight_build_muscle: Math.round(tdee * 0.9),
    build_athleticism: Math.round(tdee * 1.1),
    improve_health: tdee,
    maintain: tdee,
  }[profile.goal] || tdee;

  const w = profile.weightUnit === "lbs" ? +profile.weight * 0.453592 : +profile.weight;
  const targets = {
    protein: Math.round(w * 2.0),
    carbs: Math.round((goalCalories * 0.45) / 4),
    fat: Math.round((goalCalories * 0.25) / 9),
  };

  const actual = mealPlan ? { calories: mealPlan.calories || 0, protein: mealPlan.protein || 0, carbs: mealPlan.carbs || 0, fat: mealPlan.fat || 0 } : null;

  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: 22, color: C.slate900, marginBottom: 4 }}>Macro Calculator 📊</h2>
      <p style={{ color: C.slate500, fontSize: 14, marginBottom: 20 }}>Your personalized daily nutrition targets</p>

      {/* TDEE Card */}
      <Card style={{ padding: "20px 24px", marginBottom: 14, background: `linear-gradient(135deg, ${C.goldFaint}, ${C.creamDark})` }}>
        <div style={{ fontWeight: 700, color: C.slate700, marginBottom: 14, fontSize: 14 }}>Daily Energy Needs</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: C.slate500, marginBottom: 4 }}>Maintenance (TDEE)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.slate800 }}>{tdee || "—"}</div>
            <div style={{ fontSize: 11, color: C.slate500 }}>calories/day</div>
          </div>
          <div style={{ background: C.white, borderRadius: 14, padding: "14px 16px", border: `2px solid ${C.goldLight}` }}>
            <div style={{ fontSize: 12, color: C.slate500, marginBottom: 4 }}>Your Goal Target</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.goldDark }}>{goalCalories || "—"}</div>
            <div style={{ fontSize: 11, color: C.slate500 }}>calories/day</div>
          </div>
        </div>
      </Card>

      {/* Macro Targets */}
      <Card style={{ padding: "20px 24px", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: C.slate700, marginBottom: 16, fontSize: 14 }}>Macro Targets</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Protein", value: targets.protein, unit: "g", color: C.emerald, icon: "🥩" },
            { label: "Carbs", value: targets.carbs, unit: "g", color: C.amber, icon: "🌾" },
            { label: "Fat", value: targets.fat, unit: "g", color: C.purple, icon: "🫒" },
          ].map(m => (
            <div key={m.label} style={{ textAlign: "center", background: C.slate50, borderRadius: 14, padding: "14px 8px" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: C.slate500 }}>{m.unit} {m.label}</div>
            </div>
          ))}
        </div>

        {actual && (
          <>
            <div style={{ fontWeight: 700, color: C.slate700, marginBottom: 12, fontSize: 13 }}>Today's Progress</div>
            <MacroBar label="Protein" value={actual.protein} max={targets.protein} color={C.emerald} />
            <MacroBar label="Carbs" value={actual.carbs} max={targets.carbs} color={C.amber} />
            <MacroBar label="Fat" value={actual.fat} max={targets.fat} color={C.purple} />
            <div style={{ marginTop: 12, padding: "12px 16px", background: C.slate50, borderRadius: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: C.slate600 }}>Calories consumed</span>
              <span style={{ fontWeight: 700, color: actual.calories > goalCalories ? C.rose : C.emerald }}>{actual.calories} / {goalCalories} kcal</span>
            </div>
          </>
        )}
      </Card>

      {/* Formula info */}
      <Card style={{ padding: "16px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.slate700, marginBottom: 8 }}>How it's calculated</div>
        <div style={{ fontSize: 12, color: C.slate500, lineHeight: 1.7 }}>
          Using the <strong>Mifflin-St Jeor equation</strong> for BMR, adjusted by your activity level to get TDEE.
          Protein set at 2g/kg bodyweight for muscle preservation. Carbs & fat split based on your goal.
        </div>
      </Card>
    </div>
  );
}

// Progress
function Progress() {
  const history = store.get("plan_history") || [];
  const last7 = history.filter(p => {
    const d = new Date(p.date);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    return d >= cutoff;
  });
  const avgCal = last7.length ? Math.round(last7.reduce((s, p) => s + (p.calories || 0), 0) / last7.length) : 0;
  const avgProtein = last7.length ? Math.round(last7.reduce((s, p) => s + (p.protein || 0), 0) / last7.length) : 0;

  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: 22, color: C.slate900, marginBottom: 4 }}>Progress 📈</h2>
      <p style={{ color: C.slate500, fontSize: 14, marginBottom: 20 }}>Track your nutrition journey</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Days Tracked (7d)", value: `${last7.length}/7`, icon: "📅", color: C.gold },
          { label: "Avg Calories", value: avgCal || "—", icon: "🔥", color: "#F97316" },
          { label: "Avg Protein", value: avgProtein ? `${avgProtein}g` : "—", icon: "💪", color: C.emerald },
        ].map(s => (
          <Card key={s.label} style={{ padding: "16px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.slate500, lineHeight: 1.4, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: "20px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.slate800, marginBottom: 14 }}>Recent Meal Plans</div>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: C.slate500, fontSize: 14 }}>No meal plans yet. Start generating today!</div>
        ) : (
          history.slice(0, 10).map((p, i) => {
            const d = new Date(p.date);
            const label = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < Math.min(history.length, 10) - 1 ? `1px solid ${C.slate100}` : "none" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.slate800 }}>{label}</div>
                  <div style={{ fontSize: 12, color: C.slate500 }}>P:{p.protein}g · C:{p.carbs}g · F:{p.fat}g</div>
                </div>
                <div style={{ fontWeight: 800, color: C.goldDark, fontSize: 15 }}>{p.calories} kcal</div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

// AI Chat
function AIChat({ profile }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI nutrition assistant 🥗\n\nI can help with:\n• Meal skipping advice\n• Hitting protein goals\n• Healthy snack ideas\n• Recovery nutrition\n• Any nutrition question!\n\nHow can I help?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const ctx = profile ? `User: Goal=${profile.goal?.replace(/_/g," ")}, Activity=${profile.activity_level}, Age=${profile.age}, Weight=${profile.weight}${profile.weightUnit}, Diet=${profile.dietary_preferences?.join(",")}` : "";
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a helpful, warm AI nutrition assistant. Be concise, practical and supportive. ${ctx}`,
          messages: history,
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Sorry, I couldn't respond.";
      setMessages(p => [...p, { role: "assistant", content: text }]);
    } catch { setMessages(p => [...p, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]); }
    finally { setLoading(false); }
  };

  const quickQ = ["What if I missed a meal?", "How do I hit my protein goals?", "Best pre-workout foods?", "Healthy snack ideas?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, color: C.slate900, margin: 0 }}>AI Nutrition Chat 🤖</h2>
        <p style={{ color: C.slate500, fontSize: 13, margin: "4px 0 0" }}>Ask anything about nutrition</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 32, height: 32, background: grad, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: "75%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
              background: m.role === "user" ? grad : C.white, color: m.role === "user" ? C.white : C.slate800,
              fontSize: 14, lineHeight: 1.6, border: m.role === "assistant" ? `1px solid ${C.slate100}` : "none",
              whiteSpace: "pre-wrap",
            }}>{m.content}</div>
            {m.role === "user" && (
              <div style={{ width: 32, height: 32, background: C.slate200, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: grad, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
            <div style={{ background: C.white, border: `1px solid ${C.slate100}`, borderRadius: "18px 18px 18px 6px", padding: "12px 16px" }}>
              <Spinner size={16} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {quickQ.map(q => (
            <button key={q} onClick={() => setInput(q)} style={{ fontSize: 12, padding: "7px 14px", background: C.white, border: `1px solid ${C.slate200}`, borderRadius: 20, cursor: "pointer", color: C.slate600, fontFamily: "inherit" }}>{q}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask me anything about nutrition..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={send} disabled={!input.trim() || loading} style={{
          width: 44, height: 44, background: grad, border: "none", borderRadius: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: !input.trim() || loading ? 0.5 : 1,
        }}>→</button>
      </div>
    </div>
  );
}

// Profile Editor
function ProfileEditor({ profile, setProfile, onLogout, selectedDate, onTrainingChanged }) {
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [regenning, setRegenning] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Check if training schedule changed for the currently-viewed day
  const trainingChangedForSelectedDay = () => {
    if (!selectedDate) return false;
    const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
    const oldSessions = JSON.stringify(profile.training_schedule?.[dayName] || []);
    const newSessions = JSON.stringify(form.training_schedule?.[dayName] || []);
    return oldSessions !== newSessions;
  };

  const save = async () => {
    store.set("profile", form);
    setProfile(form);

    // Auto-regen if training schedule changed for the currently-viewed day AND a plan already exists
    const dayKey = selectedDate?.toISOString().split("T")[0];
    const existingPlan = store.get(`mealplan_${dayKey}`);
    const shouldRegen = trainingChangedForSelectedDay() && existingPlan;

    if (shouldRegen) {
      setRegenning(true);
      setSaved(false);
      try {
        await onTrainingChanged(form); // pass freshly-saved profile so generatePlan uses new schedule
      } finally {
        setRegenning(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const activityLevels = [
    { id: "sedentary",   label: "Sedentary",         desc: "Little to no exercise",   emoji: "🛋️" },
    { id: "light",       label: "Lightly Active",     desc: "1-2 days/week",           emoji: "🚶" },
    { id: "moderate",    label: "Moderately Active",  desc: "3-5 days/week",           emoji: "🏃" },
    { id: "active",      label: "Very Active",        desc: "6-7 days/week",           emoji: "💪" },
    { id: "very_active", label: "Athlete",            desc: "Intense daily training",  emoji: "🏆", sub: "Customize Training" },
  ];

  const addSlot = (day) => {
    const sched = form.training_schedule || {};
    upd("training_schedule", { ...sched, [day]: [...(sched[day] || []), { startTime: "", endTime: "" }] });
  };
  const removeSlot = (day, i) => {
    const sched = { ...form.training_schedule };
    sched[day] = (sched[day] || []).filter((_, idx) => idx !== i);
    upd("training_schedule", sched);
  };
  const updateSlot = (day, i, field, val) => {
    const sched = { ...form.training_schedule };
    sched[day] = (sched[day] || []).map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    upd("training_schedule", sched);
  };

  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: 22, color: C.slate900, marginBottom: 20 }}>Profile Settings 👤</h2>

      {/* Personal Info */}
      <Card style={{ padding: "20px 24px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 60, height: 60, background: grad, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: C.white }}>
            {form.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.slate900 }}>{form.full_name}</div>
            <Badge>{form.goal?.replace(/_/g, " ")}</Badge>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input value={form.full_name || ""} onChange={e => upd("full_name", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Age</label>
              <input type="number" value={form.age || ""} onChange={e => upd("age", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Weight ({form.weightUnit || "kg"})</label>
              <input type="number" value={form.weight || ""} onChange={e => upd("weight", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Height ({form.heightUnit || "cm"})</label>
              <input type="number" value={form.height || ""} onChange={e => upd("height", e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Level */}
      <Card style={{ padding: "20px 24px", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.slate800, marginBottom: 14 }}>🏃 Activity Level</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activityLevels.map(l => {
            const isActive = form.activity_level === l.id;
            return (
              <button key={l.id} onClick={() => upd("activity_level", l.id)} style={{
                background: isActive ? C.goldFaint : C.slate50,
                border: `2px solid ${isActive ? C.gold : C.slate100}`,
                borderRadius: 14, padding: "12px 16px", textAlign: "left", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s", fontFamily: "inherit",
              }}>
                <span style={{ fontSize: 22 }}>{l.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? C.goldDark : C.slate800 }}>{l.label}</div>
                  <div style={{ fontSize: 12, color: C.slate500 }}>{l.desc}</div>
                  {l.sub && <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginTop: 1 }}>({l.sub})</div>}
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isActive ? C.gold : C.slate300}`, background: isActive ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isActive && <div style={{ width: 7, height: 7, background: C.white, borderRadius: "50%" }} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Training Schedule — appears only for Athlete */}
        {form.activity_level === "very_active" && (
          <div style={{ marginTop: 16, padding: "18px 16px", borderRadius: 14, border: `2px solid ${C.gold}`, background: C.goldFaint, animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.slate800, marginBottom: 4 }}>🏋️ Training Schedule</div>
            <div style={{ fontSize: 12, color: C.slate500, marginBottom: 14, lineHeight: 1.5 }}>
              Set your training times for each day so your meal plan can be built around your workouts.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => {
                const daySched = (form.training_schedule || {})[day] || [];
                return (
                  <div key={day} style={{ background: C.white, borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: daySched.length > 0 ? 10 : 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: C.slate700 }}>{day}</span>
                      <button onClick={() => addSlot(day)} style={{ background: "none", border: "none", cursor: "pointer", color: C.goldDark, fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                        + Add
                      </button>
                    </div>
                    {daySched.length === 0
                      ? <div style={{ fontSize: 12, color: C.slate400, fontStyle: "italic" }}>Rest day</div>
                      : daySched.map((slot, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < daySched.length - 1 ? 8 : 0 }}>
                          <input type="time" value={slot.startTime} onChange={e => updateSlot(day, i, "startTime", e.target.value)}
                            style={{ flex: 1, height: 36, borderRadius: 9, border: `1.5px solid ${C.slate200}`, padding: "0 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                          <span style={{ fontSize: 11, color: C.slate400 }}>to</span>
                          <input type="time" value={slot.endTime} onChange={e => updateSlot(day, i, "endTime", e.target.value)}
                            style={{ flex: 1, height: 36, borderRadius: 9, border: `1.5px solid ${C.slate200}`, padding: "0 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                          <button onClick={() => removeSlot(day, i)} style={{ background: "#FEE2E2", border: "none", color: "#DC2626", width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                        </div>
                      ))
                    }
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Meal Preferences */}
      <Card style={{ padding: "20px 24px", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.slate800, marginBottom: 14 }}>🍽️ Meal Preferences</div>
        {[
          { key: "include_snacks",      label: "Include Snacks",      desc: "Add healthy snacks to your day" },
          { key: "include_pre_workout", label: "Pre-Workout Meal",    desc: "Fuel up before training" },
          { key: "include_post_workout",label: "Post-Workout Meal",   desc: "Recover and rebuild" },
        ].map((opt, idx, arr) => (
          <div key={opt.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: idx < arr.length - 1 ? `1px solid ${C.slate100}` : "none" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.slate700 }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: C.slate400 }}>{opt.desc}</div>
            </div>
            <div onClick={() => upd(opt.key, !form[opt.key])} style={{ width: 44, height: 26, borderRadius: 13, background: form[opt.key] ? C.gold : C.slate200, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 3, left: form[opt.key] ? 21 : 3, width: 20, height: 20, background: C.white, borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
            </div>
          </div>
        ))}
      </Card>

      <Btn onClick={save} disabled={regenning} style={{ width: "100%", height: 50, fontSize: 15, borderRadius: 16, marginBottom: 12 }}>
        {regenning ? <><Spinner size={16} color={C.white} /> Saving & updating meal plan...</> : saved ? "✓ Saved!" : "💾 Save Changes"}
      </Btn>

      {!confirmLogout ? (
        <button onClick={() => setConfirmLogout(true)} style={{
          width: "100%", height: 50, borderRadius: 16, border: `1.5px solid #FECACA`,
          background: "#FFF5F5", color: "#DC2626", fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          🚪 Log Out
        </button>
      ) : (
        <div style={{ background: "#FFF5F5", border: `1.5px solid #FECACA`, borderRadius: 16, padding: "16px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#DC2626", marginBottom: 6, textAlign: "center" }}>Are you sure you want to log out?</div>
          <div style={{ fontSize: 13, color: C.slate500, textAlign: "center", marginBottom: 14 }}>Your profile and meal plans are saved locally.</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setConfirmLogout(false)} style={{ flex: 1, height: 42, borderRadius: 12, border: `1.5px solid ${C.slate200}`, background: C.white, color: C.slate700, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={onLogout} style={{ flex: 1, height: 42, borderRadius: 12, border: "none", background: "#DC2626", color: C.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Yes, Log Out</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared styles
const stepTitle = { fontSize: 24, fontWeight: 800, color: C.slate900, margin: "0 0 6px", letterSpacing: -0.5 };
const stepSub = { fontSize: 14, color: C.slate500, margin: "0 0 24px" };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: C.slate700, marginBottom: 6 };
const inputStyle = {
  width: "100%", boxSizing: "border-box", height: 46, borderRadius: 12, border: `1.5px solid ${C.slate200}`,
  padding: "0 14px", fontSize: 14, color: C.slate800, fontFamily: "inherit", outline: "none", background: C.white,
};

// ── App root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Inject global keyframes
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    const saved = store.get("profile");
    if (saved?.full_name && saved?.goal) {
      setProfile(saved);
      setScreen("dashboard");
    } else {
      setScreen("landing");
    }
  }, []);

  const handleOnboardingComplete = (form) => {
    store.set("profile", form);
    setProfile(form);
    setScreen("dashboard");
  };

  const handleProfileUpdate = (updated) => {
    store.set("profile", updated);
    setProfile(updated);
  };

  const handleLogout = () => {
    localStorage.clear();
    setProfile(null);
    setScreen("landing");
  };

  if (screen === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <div style={{ width: 56, height: 56, background: grad, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, animation: "pulse 1s ease-in-out infinite" }}>✨</div>
      </div>
    );
  }

  if (screen === "landing") return <Landing onStart={() => setScreen("onboarding")} />;
  if (screen === "onboarding") return <Onboarding onComplete={handleOnboardingComplete} />;
  if (screen === "dashboard") return <Dashboard profile={profile} setProfile={handleProfileUpdate} onLogout={handleLogout} />;
}
