import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase, isSupabaseConfigured } from './supabase'
import { Menu, X, Compass, Users, HeartHandshake, TentTree, ArrowUpLeft, Instagram, Facebook, Mail, ShieldCheck, LogOut, ClipboardList, CheckCircle2, Clock3, XCircle, Send, ExternalLink } from 'lucide-react'
import './styles.css'

const logo = 'https://rst.edu.eg/wp-content/uploads/2023/06/RST-logo-01-e1724228185145.png'
const photos = [
  { src: 'https://rst.edu.eg/wp-content/uploads/2023/06/ab-img.jpg', alt: 'صورة منشورة على الموقع الرسمي لجامعة الريادة', title: 'الحياة الجامعية', caption: 'صورة من الموقع الرسمي للجامعة' },
  { src: 'https://rst.edu.eg/wp-content/uploads/2023/01/100.png', alt: 'صورة من موقع جامعة الريادة', title: 'روح الفريق', caption: 'صورة منشورة على موقع الجامعة' },
  { src: 'https://rst.edu.eg/wp-content/uploads/2026/06/Capture.png', alt: 'صورة منشورة على الموقع الرسمي للجامعة', title: 'جامعة الريادة', caption: 'صورة من الموقع الرسمي للجامعة' },
]
const faculties = ['الصيدلة','طب الفم والأسنان','العلاج الطبيعي','الحاسبات والذكاء الاصطناعي','الهندسة','التمريض','إدارة الأعمال','تكنولوجيا العلوم الصحية التطبيقية','أخرى']

function App() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function checkAdmin() {
      setIsAdmin(false)
      if (!supabase || !session?.user?.id) return
      const { data } = await supabase.from('admin_profiles').select('is_admin').eq('user_id', session.user.id).maybeSingle()
      if (data?.is_admin) {
        setIsAdmin(true)
        loadRequests()
      }
    }
    checkAdmin()
  }, [session])

  async function loadRequests() {
    if (!supabase) return
    const { data, error } = await supabase.from('join_requests').select('*').order('created_at', { ascending: false })
    if (error) setNotice('تعذر تحميل الطلبات: ' + error.message)
    else setRequests(data || [])
  }

  async function submitJoin(e) {
    e.preventDefault()
    if (!supabase) { setNotice('قاعدة البيانات غير مربوطة بعد. اتبع خطوات الإعداد في ملف README.'); return }
    setBusy(true); setNotice('')
    const form = new FormData(e.currentTarget)
    const row = Object.fromEntries(form.entries())
    const { error } = await supabase.from('join_requests').insert([{
      full_name: row.full_name.trim(), student_id: row.student_id.trim(),
      email: row.email.trim(), phone: row.phone.trim(), faculty: row.faculty,
      study_year: row.study_year, motivation: (row.motivation || '').trim(), status: 'pending'
    }])
    setBusy(false)
    if (error) setNotice('لم يتم إرسال الطلب. راجع إعداد Supabase أو حاول مرة أخرى.')
    else { setNotice('تم استلام طلبك بنجاح. سيظهر لمسؤول الجوالة للمراجعة.'); e.currentTarget.reset(); setJoinOpen(false) }
  }

  async function signIn(e) {
    e.preventDefault()
    if (!supabase) { setNotice('اربط Supabase أولًا باستخدام ملف .env.local.'); return }
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setNotice('تعذر تسجيل الدخول. تأكد من بيانات الحساب وإعدادات Supabase.')
    else { setAdminOpen(false); setNotice('تم تسجيل الدخول. لو الحساب مسؤول ستظهر لوحة الطلبات.'); }
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('join_requests').update({ status }).eq('id', id)
    if (error) setNotice('لم يتغير وضع الطلب. تحقق من صلاحيات المسؤول.')
    else { setNotice('تم تحديث حالة الطلب.'); loadRequests() }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setIsAdmin(false); setRequests([]); setNotice('تم تسجيل الخروج.')
  }

  const shownRequests = requests.filter(r => filter === 'all' || r.status === filter)
  return <div className="site" dir="rtl">
    <div className="topline"><span>جامعة الريادة للعلوم والتكنولوجيا</span><a href="https://rst.edu.eg/?lang=ar" target="_blank" rel="noreferrer">الموقع الرسمي للجامعة <ExternalLink size={13}/></a></div>
    <header className="header">
      <a href="#home" className="brand"><img src={logo} alt="شعار جامعة الريادة" onError={e => {e.currentTarget.style.display='none'}}/><span className="brand-fallback">RST</span><span className="brand-text"><b>جوالة الريادة</b><small>جامعة الريادة للعلوم والتكنولوجيا</small></span></a>
      <button className="menu-button" aria-label="فتح القائمة" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X/> : <Menu/>}</button>
      <nav className={mobileMenu ? 'nav nav-open' : 'nav'}>
        <a href="#about" onClick={() => setMobileMenu(false)}>عن الجوالة</a><a href="#values" onClick={() => setMobileMenu(false)}>قيمنا</a><a href="#activities" onClick={() => setMobileMenu(false)}>الأنشطة</a><a href="#gallery" onClick={() => setMobileMenu(false)}>معرض الصور</a>
        <button className="nav-join" onClick={() => {setJoinOpen(true);setMobileMenu(false)}}>انضم للجوالة <ArrowUpLeft size={16}/></button>
      </nav>
    </header>

    <main>
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-dot"/> الحركة الكشفية · خدمة · انتماء · قيادة</div>
          <h1>معًا نصنع قادة<br/><span>يصنعون المستقبل</span></h1>
          <p>جوالة جامعة الريادة مساحة للتطوع، والتعلّم، والعمل الجماعي، وخدمة المجتمع بروح كشفية واحدة.</p>
          <div className="hero-actions"><button className="primary" onClick={() => setJoinOpen(true)}>ابدأ رحلتك معنا <ArrowUpLeft size={18}/></button><a className="secondary" href="#about">اكتشف الجوالة <ArrowUpLeft size={18}/></a></div>
          <div className="hero-note"><ShieldCheck size={17}/> الموقع التعريفي لجوالة الجامعة</div>
        </div>
        <div className="hero-visual">
          <div className="hero-image"><img src={photos[0].src} alt="صورة من الموقع الرسمي لجامعة الريادة" onError={e => e.currentTarget.style.display='none'}/><div className="image-overlay"></div><div className="image-label"><span>RST</span><div><b>جوالة الريادة</b><small>معًا لخدمة المجتمع</small></div></div></div>
          <div className="floating-card"><div className="floating-icon"><Compass/></div><div><b>كن مستعدًا</b><small>Be Prepared</small></div></div>
          <div className="gold-orbit"></div>
        </div>
      </section>

      <section className="stats" id="values">
        <div><span className="stat-icon"><Users/></span><b>القيادة</b><small>نكتشف قدراتنا ونطوّرها</small></div>
        <div><span className="stat-icon"><HeartHandshake/></span><b>الخدمة</b><small>نترك أثرًا إيجابيًا في مجتمعنا</small></div>
        <div><span className="stat-icon"><TentTree/></span><b>المغامرة</b><small>نتعلم بالممارسة والعمل الجماعي</small></div>
        <div><span className="stat-icon"><Compass/></span><b>الانتماء</b><small>قيم تجمعنا وهدف يقودنا</small></div>
      </section>

      <section className="section about" id="about">
        <div className="section-kicker">من نحن</div><h2>أكثر من نشاط طلابي،<br/><span>إنها رحلة تصنع الفرق.</span></h2>
        <div className="about-grid"><p>الجوالة تجمع الطلاب حول قيم التعاون والانضباط والمسؤولية والمبادرة. نعمل على بناء مهارات القيادة، وتنظيم الأنشطة، والمشاركة في المبادرات التطوعية، مع احترام لوائح الجامعة وإشرافها.</p><div className="about-quote"><span>“</span><b>كن مستعدًا</b><small>شعار كشفي يلهمنا للتعلّم والمبادرة وخدمة الآخرين.</small></div></div>
      </section>

      <section className="activities section" id="activities">
        <div className="section-head"><div><div className="section-kicker">نعيش القيم بالفعل</div><h2>مساحات للنمو والعطاء</h2></div><span className="section-number">01 / الأنشطة</span></div>
        <div className="activity-grid">
          <article className="activity-card"><span className="activity-no">01</span><div className="activity-icon"><HeartHandshake/></div><h3>خدمة المجتمع</h3><p>مبادرات تطوعية تسهم في نشر روح التعاون والمسؤولية.</p></article>
          <article className="activity-card"><span className="activity-no">02</span><div className="activity-icon"><Compass/></div><h3>مهارات كشفية</h3><p>التعلّم بالممارسة، والعمل ضمن فريق، وحل المشكلات.</p></article>
          <article className="activity-card"><span className="activity-no">03</span><div className="activity-icon"><Users/></div><h3>قيادة وتنظيم</h3><p>المشاركة في إعداد الفعاليات وتطوير مهارات التواصل.</p></article>
        </div>
      </section>

      <section className="gallery section" id="gallery">
        <div className="section-head"><div><div className="section-kicker">من قلب الجامعة</div><h2>معرض الصور</h2><p className="section-sub">صور مرتبطة بالموقع الرسمي للجامعة. يُرجى الحصول على موافقة الجامعة قبل الاستخدام الرسمي.</p></div><a className="text-link" href="https://rst.edu.eg/?lang=ar" target="_blank" rel="noreferrer">المصدر الرسمي <ArrowUpLeft size={16}/></a></div>
        <div className="gallery-grid">{photos.map((p,i) => <a className={'gallery-item gallery-'+i} href="https://rst.edu.eg/?lang=ar" target="_blank" rel="noreferrer" key={p.src}><img src={p.src} alt={p.alt} onError={e => {e.currentTarget.style.display='none'}}/><div className="gallery-shade"></div><div className="gallery-caption"><b>{p.title}</b><small>{p.caption}</small></div></a>)}</div>
      </section>

      <section className="join-banner"><div><div className="section-kicker">مكانك بيننا</div><h2>خطوتك الأولى تبدأ هنا.</h2><p>قدّم طلب الانضمام، وسيتم مراجعته من مسؤول الجوالة.</p></div><button className="primary" onClick={() => setJoinOpen(true)}>طلب انضمام <ArrowUpLeft size={18}/></button></section>
    </main>

    <footer className="footer"><div className="footer-brand"><span className="brand-mark">RST</span><div><b>جوالة الريادة</b><small>جامعة الريادة للعلوم والتكنولوجيا</small></div></div><p>موقع تعريفي مستقل قيد التطوير، ولا يمثل قناة رسمية للجامعة إلا بعد اعتماد الإدارة.</p><div className="footer-links"><a href="https://rst.edu.eg/?lang=ar" target="_blank" rel="noreferrer">الموقع الرسمي</a><button onClick={() => setAdminOpen(true)}>دخول المسؤول</button></div><small className="copyright">© {new Date().getFullYear()} جوالة الريادة · نسخة أولية للمراجعة</small></footer>

    {notice && <div className="toast" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="إغلاق">×</button></div>}

    {joinOpen && <div className="modal-backdrop" onClick={() => setJoinOpen(false)}><section className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setJoinOpen(false)} aria-label="إغلاق"><X/></button><div className="section-kicker">طلب انضمام</div><h2>خلّي لك أثر.</h2><p className="modal-intro">املأ البيانات التالية. لا تشارك بيانات حساسة غير مطلوبة.</p><form onSubmit={submitJoin} className="form-grid">
      <label>الاسم بالكامل<input name="full_name" required minLength="2" maxLength="120" autoComplete="name"/></label>
      <label>الرقم الجامعي<input name="student_id" required minLength="2" maxLength="40"/></label>
      <label>البريد الإلكتروني<input type="email" name="email" required maxLength="254" autoComplete="email"/></label>
      <label>رقم الهاتف<input type="tel" name="phone" required minLength="7" maxLength="30" autoComplete="tel"/></label>
      <label>الكلية<select name="faculty" required defaultValue=""><option value="" disabled>اختر الكلية</option>{faculties.map(f => <option key={f}>{f}</option>)}</select></label>
      <label>الفرقة الدراسية<select name="study_year" required defaultValue=""><option value="" disabled>اختر الفرقة</option>{['الأولى','الثانية','الثالثة','الرابعة','الخامسة','أخرى'].map(f => <option key={f}>{f}</option>)}</select></label>
      <label className="full-field">لماذا تريد الانضمام؟<textarea name="motivation" maxLength="1000" rows="3" placeholder="اكتب نبذة قصيرة (اختياري)"/></label>
      <button className="primary full-field" disabled={busy} type="submit"><Send size={17}/>{busy ? 'جارٍ الإرسال...' : 'إرسال طلب الانضمام'}</button>
      {!isSupabaseConfigured && <p className="form-warning full-field">تنبيه: يلزم ربط قاعدة بيانات Supabase قبل استقبال الطلبات فعليًا.</p>}
    </form></section></div>}

    {adminOpen && <div className="modal-backdrop" onClick={() => setAdminOpen(false)}><section className="modal admin-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setAdminOpen(false)} aria-label="إغلاق"><X/></button><div className="section-kicker">مساحة المسؤول</div><h2>تسجيل دخول الإدارة</h2>{session && !isAdmin ? <p>تم تسجيل الدخول، لكن الحساب ليس لديه صلاحية مسؤول. يجب منح الصلاحية من Supabase.</p> : <form onSubmit={signIn} className="form-grid one-col"><label>البريد الإلكتروني<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username"/></label><label>كلمة المرور<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/></label><button className="primary" disabled={busy}>{busy ? 'جارٍ الدخول...' : 'تسجيل الدخول'}</button></form>}{!isSupabaseConfigured && <p className="form-warning">اربط Supabase أولًا؛ لن تعمل المصادقة قبل الإعداد.</p>}</section></div>}

    {isAdmin && <div className="admin-panel"><div className="admin-panel-head"><div><span className="section-kicker">لوحة الإدارة</span><h2>طلبات الانضمام</h2></div><button className="logout" onClick={signOut}><LogOut size={16}/> خروج</button></div><div className="admin-toolbar"><div className="filters">{[['pending','قيد المراجعة'],['accepted','مقبول'],['rejected','مرفوض'],['all','الكل']].map(([v,t])=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{t}</button>)}</div><button className="refresh" onClick={loadRequests}>تحديث</button></div><div className="request-list">{shownRequests.length===0 ? <p className="empty">لا توجد طلبات في هذا التصنيف.</p> : shownRequests.map(r=><article className="request" key={r.id}><div className="request-main"><b>{r.full_name}</b><span>{r.faculty} · الفرقة {r.study_year}</span><small>{r.email} · {r.phone} · رقم جامعي: {r.student_id}</small>{r.motivation && <p>{r.motivation}</p>}<small>{new Date(r.created_at).toLocaleString('ar-EG')}</small></div><div className="request-actions"><button onClick={()=>updateStatus(r.id,'accepted')} title="قبول"><CheckCircle2 size={17}/> قبول</button><button onClick={()=>updateStatus(r.id,'pending')} title="إرجاع للمراجعة"><Clock3 size={17}/> مراجعة</button><button onClick={()=>updateStatus(r.id,'rejected')} title="رفض"><XCircle size={17}/> رفض</button></div></article>)}</div></div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App />)
