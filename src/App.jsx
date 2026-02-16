import React, { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const PRAYERS = [
  { id: 1, author: "Sarah M.", category: "Health", text: "Please pray for my mom's surgery tomorrow morning. She's having a double bypass and she's scared. We trust God's plan but could use your prayers for the surgical team and a smooth recovery.", time: "2h ago", day: 1, prayerCount: 47, prayerMinutes: 192, isMine: false, answered: false, anon: false },
  { id: 2, author: "A Church Member", category: "Family", text: "Going through a really difficult season in my marriage. We're both believers but struggling to communicate. Praying for restoration and wisdom.", time: "5h ago", day: 2, prayerCount: 31, prayerMinutes: 98, isMine: false, answered: false, anon: true },
  { id: 3, author: "James K.", category: "Work", text: "I was laid off last Friday after 12 years. Feeling lost but trusting God has a plan. Prayers for provision and for the right doors to open.", time: "8h ago", day: 3, prayerCount: 63, prayerMinutes: 287, isMine: false, answered: false, anon: false },
  { id: 4, author: "You", category: "Health", text: "Asking for prayers as I deal with some ongoing back pain that's been affecting my ability to work and be present with my family. Trusting God for healing.", time: "1d ago", day: 4, prayerCount: 38, prayerMinutes: 156, isMine: true, answered: false, anon: false },
  { id: 5, author: "David R.", category: "Spiritual", text: "Asking for prayer as I prepare to lead our youth group through a study on identity in Christ. Pray that the students' hearts would be open.", time: "2d ago", day: 5, prayerCount: 28, prayerMinutes: 67, isMine: false, answered: false, anon: false },
];

const JOURNAL_ENTRIES = [
  { id: 101, text: "Lord, give me patience with the kids this week. Help me be the dad they need.", category: "Family", created: "Today", answered: false },
  { id: 102, text: "Praying for Jessica's work situation — the staffing changes are stressing her out. Give her wisdom and peace.", category: "Family", created: "2 days ago", answered: false },
  { id: 103, text: "Thank you for Mia's safety. Continue to watch over her.", category: "Gratitude", created: "4 days ago", answered: false },
];

const PROMPTS = [
  { icon: "🏠", q: "What's been weighing on your family lately?" },
  { icon: "💼", q: "Any work struggles you need to bring before God?" },
  { icon: "🙏", q: "How has your personal time in God's word been?" },
  { icon: "💛", q: "What do you have to be thankful for right now?" },
  { icon: "🤝", q: "Any friends or neighbors on your heart?" },
  { icon: "⚔️", q: "What personal struggle needs God's strength today?" },
];

const CAT_COLORS = { Health: "#e06060", Family: "#5b8db8", Work: "#c9a227", Gratitude: "#5a9e6f", Spiritual: "#8b6caf", Other: "#7a8a9a" };

function formatTime(m) { return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; }

/* ═══════════════════════════════════════════
   RING COMPONENT
   ═══════════════════════════════════════════ */
function Ring({ progress, size, sw, color, children }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={c} strokeDashoffset={c - Math.min(progress, 1) * c} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FULL-SCREEN PRAYER CARD (SNAP SCROLL)
   ═══════════════════════════════════════════ */
function FullScreenPrayer({ prayer, onPrayStart, onPrayEnd, isPraying, dur, idx, total }) {
  const catColor = CAT_COLORS[prayer.category] || CAT_COLORS.Other;

  return (
    <div style={{
      height: "100%", width: "100%", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "60px 28px 100px",
      position: "relative", scrollSnapAlign: "start",
      background: isPraying
        ? "radial-gradient(ellipse at 50% 40%, rgba(90,140,200,0.12) 0%, transparent 70%)"
        : "transparent",
      transition: "background 0.8s ease",
    }}>
      {/* Day indicator */}
      <div style={{
        position: "absolute", top: 16, right: 20, fontSize: 11,
        color: "rgba(255,255,255,0.3)", letterSpacing: 1, fontFamily: "'Cormorant Garamond', serif",
      }}>
        DAY {prayer.day} OF 7
      </div>

      {/* Category pill */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24,
        padding: "5px 14px", borderRadius: 20,
        background: `${catColor}20`, border: `1px solid ${catColor}40`,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: catColor }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: catColor, letterSpacing: 1.2, textTransform: "uppercase" }}>
          {prayer.category}
        </span>
      </div>

      {/* Prayer text */}
      <p style={{
        fontSize: 22, lineHeight: 1.7, color: "rgba(255,255,255,0.92)",
        textAlign: "center", maxWidth: 380, margin: "0 0 28px",
        fontFamily: "'Cormorant Garamond', serif", fontWeight: 400,
        textShadow: "0 1px 8px rgba(0,0,0,0.3)",
      }}>
        {prayer.text}
      </p>

      {/* Author */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 32,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: prayer.anon ? "rgba(255,255,255,0.15)" : `linear-gradient(135deg, ${catColor}cc, ${catColor})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 13, fontWeight: 700,
        }}>
          {prayer.anon ? "?" : prayer.author[0]}
        </div>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "'Cormorant Garamond', serif" }}>
          {prayer.author} · {prayer.time}
        </span>
      </div>

      {/* Poster-only stats */}
      {prayer.isMine && !isPraying && (
        <div style={{
          background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "14px 24px",
          marginBottom: 24, border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)", textAlign: "center",
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(200,180,140,0.7)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            Your prayer's support
          </div>
          <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
            <div>
              <span style={{ fontSize: 28, fontWeight: 300, color: "rgba(200,180,140,0.9)", fontFamily: "'Cormorant Garamond', serif" }}>{prayer.prayerCount}</span>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>prayed</div>
            </div>
            <div>
              <span style={{ fontSize: 28, fontWeight: 300, color: "rgba(200,180,140,0.9)", fontFamily: "'Cormorant Garamond', serif" }}>{formatTime(prayer.prayerMinutes)}</span>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>in prayer</div>
            </div>
          </div>
        </div>
      )}

      {/* Hold to Pray / Poster actions */}
      {prayer.isMine ? (
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 24, padding: "12px 22px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif", letterSpacing: 0.5 }}>Post Update</button>
          <button style={{ background: "rgba(90,158,111,0.15)", border: "1px solid rgba(90,158,111,0.3)", borderRadius: 24, padding: "12px 22px", fontSize: 13, fontWeight: 600, color: "#5a9e6f", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif", letterSpacing: 0.5 }}>Mark Answered</button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          {isPraying && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 120, height: 120, borderRadius: "50%",
              border: "2px solid rgba(200,180,140,0.2)",
              animation: "breathe 3s ease-in-out infinite",
            }} />
          )}
          <button
            onMouseDown={onPrayStart} onMouseUp={onPrayEnd} onMouseLeave={onPrayEnd}
            onTouchStart={onPrayStart} onTouchEnd={onPrayEnd}
            style={{
              width: isPraying ? 90 : 80, height: isPraying ? 90 : 80,
              borderRadius: "50%",
              background: isPraying
                ? "radial-gradient(circle, rgba(200,180,140,0.25) 0%, rgba(200,180,140,0.08) 70%)"
                : "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 70%)",
              border: isPraying ? "2px solid rgba(200,180,140,0.5)" : "1.5px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: isPraying ? "0 0 40px rgba(200,180,140,0.15)" : "none",
              userSelect: "none", WebkitUserSelect: "none",
              position: "relative", zIndex: 2,
            }}
          >
            {isPraying ? (
              <>
                <span style={{ fontSize: 20, fontWeight: 300, color: "rgba(200,180,140,0.9)", fontFamily: "'Cormorant Garamond', serif" }}>
                  {dur}s
                </span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
                  <path d="M12 21C12 21 3 13.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 13.5 12 21 12 21Z" />
                </svg>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: 0.8, textTransform: "uppercase" }}>
                  Hold
                </span>
              </>
            )}
          </button>
          {isPraying && (
            <div style={{
              textAlign: "center", marginTop: 12, fontSize: 12,
              color: "rgba(200,180,140,0.5)", fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic", animation: "fadeIn 0.8s ease",
            }}>
              praying...
            </div>
          )}
        </div>
      )}

      {/* Scroll indicator */}
      {idx < total - 1 && !isPraying && (
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          animation: "bob 2s ease-in-out infinite",
        }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 1 }}>SCROLL</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   JOURNAL CARD
   ═══════════════════════════════════════════ */
function JournalCard({ entry, onPrayStart, onPrayEnd, isPraying, dur }) {
  const catColor = CAT_COLORS[entry.category] || CAT_COLORS.Other;
  return (
    <div style={{
      height: "100%", width: "100%", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "60px 28px 100px",
      scrollSnapAlign: "start",
      background: isPraying ? "radial-gradient(ellipse at 50% 40%, rgba(200,180,140,0.08) 0%, transparent 70%)" : "transparent",
      transition: "background 0.8s ease",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: "rgba(200,180,140,0.4)",
        letterSpacing: 2, textTransform: "uppercase", marginBottom: 20,
      }}>
        Personal Prayer
      </div>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24,
        padding: "5px 14px", borderRadius: 20,
        background: `${catColor}20`, border: `1px solid ${catColor}40`,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: catColor }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: catColor, letterSpacing: 1.2, textTransform: "uppercase" }}>
          {entry.category}
        </span>
      </div>

      <p style={{
        fontSize: 22, lineHeight: 1.7, color: "rgba(255,255,255,0.88)",
        textAlign: "center", maxWidth: 380, margin: "0 0 20px",
        fontFamily: "'Cormorant Garamond', serif", fontWeight: 400,
        fontStyle: "italic",
      }}>
        {entry.text}
      </p>

      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 32 }}>{entry.created}</span>

      <div style={{ position: "relative" }}>
        {isPraying && (
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 120, height: 120, borderRadius: "50%",
            border: "2px solid rgba(200,180,140,0.2)", animation: "breathe 3s ease-in-out infinite",
          }} />
        )}
        <button
          onMouseDown={onPrayStart} onMouseUp={onPrayEnd} onMouseLeave={onPrayEnd}
          onTouchStart={onPrayStart} onTouchEnd={onPrayEnd}
          style={{
            width: isPraying ? 90 : 80, height: isPraying ? 90 : 80, borderRadius: "50%",
            background: isPraying
              ? "radial-gradient(circle, rgba(200,180,140,0.25) 0%, rgba(200,180,140,0.08) 70%)"
              : "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 70%)",
            border: isPraying ? "2px solid rgba(200,180,140,0.5)" : "1.5px solid rgba(255,255,255,0.2)",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: isPraying ? "0 0 40px rgba(200,180,140,0.15)" : "none",
            userSelect: "none", WebkitUserSelect: "none", position: "relative", zIndex: 2,
          }}
        >
          {isPraying ? (
            <span style={{ fontSize: 20, fontWeight: 300, color: "rgba(200,180,140,0.9)", fontFamily: "'Cormorant Garamond', serif" }}>{dur}s</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
                <path d="M12 21C12 21 3 13.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 13.5 12 21 12 21Z" />
              </svg>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: 0.8, textTransform: "uppercase" }}>Hold</span>
            </>
          )}
        </button>
        {isPraying && (
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "rgba(200,180,140,0.5)", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", animation: "fadeIn 0.8s ease" }}>
            praying...
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   JOURNAL PROMPT CARD
   ═══════════════════════════════════════════ */
function PromptCard({ prompt, onSelect }) {
  return (
    <button onClick={() => onSelect(prompt.q)} style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: "16px 18px", cursor: "pointer",
      textAlign: "left", transition: "all 0.3s", width: "100%",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(200,180,140,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      <span style={{ fontSize: 18, marginRight: 10 }}>{prompt.icon}</span>
      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "'Cormorant Garamond', serif" }}>{prompt.q}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   COMPOSE / JOURNAL ENTRY MODAL
   ═══════════════════════════════════════════ */
function ComposeModal({ onClose, onSubmit, mode, initialText }) {
  const [text, setText] = useState(initialText || "");
  const [category, setCategory] = useState("Other");
  const [namePrivate, setNamePrivate] = useState(false);
  const isJournal = mode === "journal";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(8px)",
    }} onClick={onClose}>
      <div style={{
        background: "linear-gradient(180deg, #1a2332 0%, #12171f 100%)",
        borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480,
        padding: "28px 24px 36px", animation: "slideUp 0.4s cubic-bezier(0.4,0,0.2,1)",
        border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{
            margin: 0, fontSize: 18, color: "rgba(200,180,140,0.9)",
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 400,
          }}>
            {isJournal ? "New Journal Entry" : "Share a Prayer Need"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>×</button>
        </div>

        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder={isJournal ? "What's on your heart today..." : "Share what's on your heart..."}
          style={{
            width: "100%", minHeight: 120, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
            padding: 16, fontSize: 16, fontFamily: "'Cormorant Garamond', serif",
            color: "rgba(255,255,255,0.85)", resize: "vertical", outline: "none",
            boxSizing: "border-box", lineHeight: 1.6,
          }}
          onFocus={e => e.target.style.borderColor = "rgba(200,180,140,0.4)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
          {Object.keys(CAT_COLORS).filter(c => c !== "Other").map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: category === cat ? `1.5px solid ${CAT_COLORS[cat]}` : "1px solid rgba(255,255,255,0.1)",
              background: category === cat ? `${CAT_COLORS[cat]}20` : "transparent",
              color: category === cat ? CAT_COLORS[cat] : "rgba(255,255,255,0.4)",
              cursor: "pointer", letterSpacing: 0.5, textTransform: "uppercase",
            }}>{cat}</button>
          ))}
        </div>

        {!isJournal && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer", marginBottom: 20 }}>
            <input type="checkbox" checked={namePrivate} onChange={() => setNamePrivate(!namePrivate)}
              style={{ accentColor: "#c8b48c" }} />
            Keep my name private
          </label>
        )}

        <button onClick={() => { if (text.trim()) onSubmit({ text, category, namePrivate, isJournal }); }} style={{
          width: "100%", padding: "14px", borderRadius: 14, border: "none",
          background: text.trim() ? "linear-gradient(135deg, rgba(200,180,140,0.3), rgba(200,180,140,0.15))" : "rgba(255,255,255,0.04)",
          color: text.trim() ? "rgba(200,180,140,0.9)" : "rgba(255,255,255,0.2)",
          fontSize: 15, fontWeight: 600, cursor: text.trim() ? "pointer" : "default",
          fontFamily: "'Cormorant Garamond', serif", letterSpacing: 1,
          border: text.trim() ? "1px solid rgba(200,180,140,0.3)" : "1px solid rgba(255,255,255,0.05)",
        }}>
          {isJournal ? "Add to Journal" : "Submit Prayer"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DASHBOARD MODAL
   ═══════════════════════════════════════════ */
function DashboardModal({ stats, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(8px)",
    }} onClick={onClose}>
      <div style={{
        background: "linear-gradient(180deg, #1a2332, #12171f)",
        borderRadius: 24, width: "100%", maxWidth: 380, padding: "32px 28px",
        margin: "0 20px", animation: "fadeIn 0.4s ease",
        border: "1px solid rgba(255,255,255,0.06)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 20, color: "rgba(200,180,140,0.9)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>My Prayer Life</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>×</button>
        </div>
        <p style={{ margin: "0 0 24px", fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: 1 }}>ONLY YOU CAN SEE THIS</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, marginBottom: 28 }}>
          <Ring progress={stats.pw / stats.gp} size={130} sw={9} color="#e06060">
            <Ring progress={stats.mw / stats.gm} size={100} sw={9} color="#5b8db8">
              <Ring progress={stats.nw / stats.gn} size={70} sw={9} color="#5a9e6f">
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>WEEK</span>
              </Ring>
            </Ring>
          </Ring>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[["#e06060", `${stats.pw}/${stats.gp}`, "prayers"], ["#5b8db8", `${stats.mw}/${stats.gm}`, "minutes"], ["#5a9e6f", `${stats.nw}/${stats.gn}`, "needs"]].map(([c, v, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontFamily: "'Cormorant Garamond', serif" }}><b>{v}</b> {l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: 1.5, marginBottom: 14 }}>THIS MONTH</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[[stats.pm, "prayers"], [formatTime(stats.mm), "in prayer"], [stats.nm, "needs"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 300, color: "rgba(200,180,140,0.8)", fontFamily: "'Cormorant Garamond', serif" }}>{v}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function PrayerFeedApp() {
  const [tab, setTab] = useState("feed");
  const [prayers, setPrayers] = useState(PRAYERS);
  const [journal, setJournal] = useState(JOURNAL_ENTRIES);
  const [prayingId, setPrayingId] = useState(null);
  const [dur, setDur] = useState(0);
  const [showCompose, setShowCompose] = useState(null);
  const [showDash, setShowDash] = useState(false);
  const [notif, setNotif] = useState(null);
  const [journalView, setJournalView] = useState("cards");
  const [promptText, setPromptText] = useState("");
  const [stats, setStats] = useState({ pw: 12, mw: 34, nw: 8, gp: 15, gm: 45, gn: 10, pm: 38, mm: 107, nm: 19 });
  const intRef = useRef(null);

  const startPray = useCallback((id) => {
    if (intRef.current) return;
    setPrayingId(id); setDur(0);
    intRef.current = setInterval(() => setDur(d => d + 1), 1000);
  }, []);

  const stopPray = useCallback(() => {
    if (intRef.current) { clearInterval(intRef.current); intRef.current = null; }
    if (prayingId && dur > 0) {
      const s = dur;
      setStats(p => ({ ...p, pw: p.pw + 1, pm: p.pm + 1, mw: p.mw + Math.max(1, Math.round(s / 60)), mm: p.mm + Math.max(1, Math.round(s / 60)) }));
      setNotif(`Prayer recorded · ${s}s`);
      setTimeout(() => setNotif(null), 2500);
    }
    setPrayingId(null); setDur(0);
  }, [prayingId, dur]);

  useEffect(() => () => { if (intRef.current) clearInterval(intRef.current); }, []);

  const handleSubmit = ({ text, category, namePrivate, isJournal }) => {
    if (isJournal) {
      setJournal([{ id: Date.now(), text, category, created: "Just now", answered: false }, ...journal]);
    } else {
      setPrayers([{ id: Date.now(), author: namePrivate ? "A Church Member" : "You", category, text, time: "Just now", day: 1, prayerCount: 0, prayerMinutes: 0, isMine: true, answered: false, anon: namePrivate }, ...prayers]);
    }
    setShowCompose(null); setPromptText("");
    setNotif(isJournal ? "Added to your prayer journal" : "Prayer request posted");
    setTimeout(() => setNotif(null), 2500);
  };

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", height: "100vh",
      background: "linear-gradient(160deg, #0d1117 0%, #131a24 40%, #0d1117 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />
      <style>{`@keyframes breathe { 0%,100% { transform:translate(-50%,-50%) scale(1); opacity:0.5; } 50% { transform:translate(-50%,-50%) scale(1.3); opacity:0; } } @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } } @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } } @keyframes bob { 0%,100% { transform:translateX(-50%) translateY(0); } 50% { transform:translateX(-50%) translateY(6px); } } @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } } * { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }`}</style>

      {/* ── HEADER ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "16px 20px 12px",
        background: "linear-gradient(180deg, rgba(13,17,23,0.95) 0%, rgba(13,17,23,0.6) 70%, transparent 100%)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: 18, fontWeight: 400, color: "rgba(200,180,140,0.85)",
              fontFamily: "'Cormorant Garamond', serif", letterSpacing: 1,
            }}>
              Grace Community
            </h1>
          </div>
          <button onClick={() => setShowDash(true)} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "6px 14px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(200,180,140,0.6)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: 11, color: "rgba(200,180,140,0.6)", letterSpacing: 0.5 }}>My Prayer Life</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginTop: 12 }}>
          {[["feed", "Prayers"], ["journal", "My Journal"], ["wall", "Answered"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 500, cursor: "pointer",
              background: "none", border: "none", letterSpacing: 0.8,
              fontFamily: "'Cormorant Garamond', serif",
              color: tab === k ? "rgba(200,180,140,0.9)" : "rgba(255,255,255,0.25)",
              borderBottom: tab === k ? "1.5px solid rgba(200,180,140,0.5)" : "1.5px solid transparent",
              transition: "all 0.3s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── NOTIFICATION ── */}
      {notif && (
        <div style={{
          position: "absolute", top: 100, left: "50%", transform: "translateX(-50%)",
          zIndex: 100, padding: "10px 24px", borderRadius: 20,
          background: "rgba(90,158,111,0.15)", border: "1px solid rgba(90,158,111,0.3)",
          color: "rgba(90,158,111,0.9)", fontSize: 13, fontWeight: 500,
          animation: "fadeIn 0.3s ease", backdropFilter: "blur(8px)",
          fontFamily: "'Cormorant Garamond', serif", letterSpacing: 0.5,
        }}>{notif}</div>
      )}

      {/* ── FEED (SNAP SCROLL) ── */}
      {tab === "feed" && (
        <div style={{
          height: "100%", overflowY: "scroll", scrollSnapType: "y mandatory",
          scrollbarWidth: "none", paddingBottom: 80
        }}>
          {prayers.filter(p => !p.answered).map((prayer, i, arr) => (
            <div key={prayer.id} style={{ height: "100vh", scrollSnapAlign: "start" }}>
              <FullScreenPrayer
                prayer={prayer} idx={i} total={arr.length}
                isPraying={prayingId === prayer.id} dur={dur}
                onPrayStart={() => startPray(prayer.id)}
                onPrayEnd={stopPray}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── JOURNAL ── */}
      {tab === "journal" && (
        <>
          {journalView === "cards" ? (
            <div style={{
              height: "100%", overflowY: "scroll", scrollSnapType: "y mandatory",
              scrollbarWidth: "none", paddingBottom: 80
            }}>
              {journal.length === 0 ? (
                <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px", scrollSnapAlign: "start" }}>
                  <p style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", textAlign: "center", fontFamily: "'Cormorant Garamond', serif" }}>
                    Your prayer journal is empty. Tap + or try a prompt below.
                  </p>
                </div>
              ) : (
                journal.map(entry => (
                  <div key={entry.id} style={{ height: "100vh", scrollSnapAlign: "start" }}>
                    <JournalCard
                      entry={entry}
                      isPraying={prayingId === entry.id} dur={dur}
                      onPrayStart={() => startPray(entry.id)}
                      onPrayEnd={stopPray}
                    />
                  </div>
                ))
              )}
              {/* Prompts page */}
              <div style={{
                height: "100vh", scrollSnapAlign: "start",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "60px 28px",
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: "rgba(200,180,140,0.4)",
                  letterSpacing: 2, textTransform: "uppercase", marginBottom: 24,
                }}>
                  What should you pray about?
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360 }}>
                  {PROMPTS.map((pr, i) => (
                    <PromptCard key={i} prompt={pr} onSelect={(q) => { setPromptText(q + "\n\n"); setShowCompose("journal"); }} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* ── WALL (ANSWERED) ── */}
      {tab === "wall" && (
        <div style={{
          height: "100%", overflowY: "scroll", scrollSnapType: "y mandatory",
          scrollbarWidth: "none", paddingBottom: 80
        }}>
          {prayers.filter(p => p.answered).length === 0 ? (
            <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", scrollSnapAlign: "start" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🕊️</div>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
                No answered prayers yet. They're coming.
              </p>
            </div>
          ) : (
            prayers.filter(p => p.answered).map((prayer, i, arr) => (
              <div key={prayer.id} style={{ height: "100vh", scrollSnapAlign: "start" }}>
                <FullScreenPrayer
                  prayer={prayer} idx={i} total={arr.length}
                  isPraying={prayingId === prayer.id} dur={dur}
                  onPrayStart={() => startPray(prayer.id)}
                  onPrayEnd={stopPray}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* ── FAB ── */}
      <button onClick={() => setShowCompose(tab === "journal" ? "journal" : "feed")} style={{
        position: "absolute", bottom: 28, right: 28,
        width: 52, height: 52, borderRadius: "50%",
        background: "rgba(200,180,140,0.1)", border: "1px solid rgba(200,180,140,0.25)",
        color: "rgba(200,180,140,0.7)", fontSize: 24, fontWeight: 300,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 40, backdropFilter: "blur(8px)",
        transition: "all 0.3s",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,180,140,0.2)"; e.currentTarget.style.borderColor = "rgba(200,180,140,0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(200,180,140,0.1)"; e.currentTarget.style.borderColor = "rgba(200,180,140,0.25)"; }}
      >+</button>

      {/* ── MODALS ── */}
      {showCompose && (
        <ComposeModal
          mode={showCompose === "journal" ? "journal" : "feed"}
          initialText={promptText}
          onClose={() => { setShowCompose(null); setPromptText(""); }}
          onSubmit={handleSubmit}
        />
      )}
      {showDash && <DashboardModal stats={stats} onClose={() => setShowDash(false)} />}
    </div>
  );
}
