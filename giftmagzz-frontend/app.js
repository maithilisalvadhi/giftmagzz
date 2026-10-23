/* GiftMagzz frontend configuration.
   Set API_BASE_URL to your deployed backend URL when deploying globally.
   Use an international WhatsApp number with digits only, e.g. 919876543210. */
const API_BASE_URL = "http://localhost:5000/api";
const WHATSAPP_NUMBER = "YOUR_WHATSAPP_NUMBER";
const PAGE_PRICES = { 8: 700, 12: 800, 16: 900, 20: 1000 };
const SHIPPING_COST = 150;
const THEMES = [
  {name:"Swathi Magazine",tag:"Personal editorial",a:"#d9b6a3",b:"#52677d"},
  {name:"Anniversary",tag:"Celebrate us",a:"#e5b6c0",b:"#7f294d"},
  {name:"Birthday",tag:"Your special day",a:"#f5ce7a",b:"#c26c75"},
  {name:"Friends",tag:"The chosen family",a:"#a7c9d5",b:"#3b657f"},
  {name:"Rakhi",tag:"A sibling bond",a:"#e8b96f",b:"#9d3f42"},
  {name:"Memories",tag:"Little moments",a:"#b8c4df",b:"#3f527d"},
  {name:"Farewell",tag:"A beautiful goodbye",a:"#c4b2df",b:"#564a86"},
  {name:"Father's Day",tag:"For your hero",a:"#a9c2b1",b:"#2d5b4c"},
  {name:"Couple",tag:"Two hearts, one story",a:"#edb9bd",b:"#8c3e58"},
  {name:"Valentine's",tag:"Love, in every page",a:"#ef9fae",b:"#9b244b"},
  {name:"You & Me",tag:"Our own little world",a:"#a9c8f2",b:"#324e92"}
];
const state = { pages: null, theme: null, token: localStorage.getItem("mm_token") || "", user: JSON.parse(localStorage.getItem("mm_user") || "null"), authMode: "signin", order: null };
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const money = (n) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const price = () => state.pages ? PAGE_PRICES[state.pages] : 0;
const total = () => price() + (state.pages ? SHIPPING_COST : 0);
const safe = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),3200)}
async function api(path, options={}) {
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(state.token) headers.Authorization=`Bearer ${state.token}`;
  const res=await fetch(`${API_BASE_URL}${path}`,{...options,headers});
  const data=await res.json().catch(()=>({message:"Unexpected server response"}));
  if(!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
function renderThemes(){
  $("#themeGrid").innerHTML=THEMES.map((t,i)=>`<button class="theme-card ${state.theme===t.name?"selected":""}" data-theme="${safe(t.name)}"><div class="theme-art" style="--art1:${t.a};--art2:${t.b}"><span class="art-word">${safe(t.name)}</span></div><div class="theme-info"><strong>${safe(t.name)}</strong><span>↗</span></div></button>`).join("");
  $("#themePicker").innerHTML=THEMES.map(t=>`<button class="theme-option ${state.theme===t.name?"selected":""}" data-theme="${safe(t.name)}">${safe(t.name)}</button>`).join("");
}
function renderPages(){
  $("#pageGrid").innerHTML=Object.entries(PAGE_PRICES).map(([pages,cost])=>`<button class="page-card ${state.pages===Number(pages)?"selected":""}" data-pages="${pages}"><strong>${pages}</strong><span>PAGES</span><b>${money(cost)}</b></button>`).join("");
}
function renderSummary(){
  $("#sumPages").textContent=state.pages?`${state.pages} pages`:"Choose pages";
  $("#sumTheme").textContent=state.theme||"Choose theme";
  $("#sumMagazine").textContent=money(price());
  $("#sumTotal").textContent=money(total());
  $("#sumAdvance").textContent=money(Math.ceil(total()/2));
  $("#sumRemaining").textContent=money(Math.floor(total()/2));
}
function render(){renderThemes();renderPages();renderSummary()}
function openAuth(mode="signin"){
  state.authMode=mode; $("#authDrawer").classList.add("open");$("#drawerBackdrop").classList.add("open");$("#authDrawer").setAttribute("aria-hidden","false");document.body.style.overflow="hidden";setAuthMode(mode);
}
function closeAuth(){$("#authDrawer").classList.remove("open");$("#drawerBackdrop").classList.remove("open");$("#authDrawer").setAttribute("aria-hidden","true");document.body.style.overflow="";$("#authMessage").textContent=""}
function setAuthMode(mode){
  state.authMode=mode;const signup=mode==="signup";
  $$("[data-auth-tab]").forEach(b=>b.classList.toggle("active",b.dataset.authTab===mode));
  $("#authTitle").textContent=signup?"Create an account. Keep every memory.":"Welcome back.";
  $("#nameField").classList.toggle("hidden",!signup);$("#mobileField").classList.toggle("hidden",!signup);$("#signupEmailField").classList.add("hidden");
  $("#authName").required=signup;$("#authMobile").required=signup;$("#authConfirm").required=signup;$("#confirmField").classList.toggle("hidden",!signup);
  $("#authIdentity").placeholder=signup?"Email address":"Email or mobile number";
  $("#authIdentity").required=!signup;$("#authSubmit").innerHTML=signup?'Create account <span>↗</span>':'Sign in <span>↗</span>';
  $("#authPassword").autocomplete=signup?"new-password":"current-password";$("#authMessage").textContent="";
}
async function submitAuth(e){
  e.preventDefault();const msg=$("#authMessage");msg.classList.remove("success");msg.textContent="";
  const password=$("#authPassword").value;
  try{
    let result;
    if(state.authMode==="signup"){
      if(password!==$("#authConfirm").value) throw new Error("Passwords do not match.");
      const name=$("#authName").value.trim(), mobile=$("#authMobile").value.trim(), identity=$("#authIdentity").value.trim();
      if(!name||!mobile||!identity) throw new Error("Please fill in all required fields.");
      const email=identity.includes("@")?identity:($("#authEmail").value.trim()||"");
      result=await api("/auth/register",{method:"POST",body:JSON.stringify({name,email,mobile,password})});
    }else{
      result=await api("/auth/login",{method:"POST",body:JSON.stringify({identity:$("#authIdentity").value.trim(),password})});
    }
    state.token=result.token;state.user=result.user;localStorage.setItem("mm_token",state.token);localStorage.setItem("mm_user",JSON.stringify(state.user));
    msg.textContent=state.authMode==="signup"?"Account created successfully.":"Signed in successfully.";msg.classList.add("success");
    toast(`Welcome${state.user.name?`, ${state.user.name}`:""}!`);
    setTimeout(()=>{closeAuth();if(!state.pages)$("#order").scrollIntoView({behavior:"smooth"});},450);
  }catch(err){msg.textContent=err.message||"Could not complete authentication."}
}
async function placeOrder(){
  if(!state.user||!state.token){openAuth("signin");toast("Please sign in before placing an order.");return}
  if(!state.pages){toast("Please select a page package.");$("#pageGrid").scrollIntoView({behavior:"smooth",block:"center"});return}
  if(!state.theme){toast("Please select a theme.");$("#themePicker").scrollIntoView({behavior:"smooth",block:"center"});return}
  if(!$("#policyAccepted").checked){toast("Please acknowledge the shipping and payment policy.");$("#policies").scrollIntoView({behavior:"smooth",block:"center"});return}
  const btn=$("#placeOrder");btn.disabled=true;btn.textContent="Submitting request…";
  try{
    const data=await api("/orders",{method:"POST",body:JSON.stringify({pages:state.pages,theme:state.theme,policyAccepted:true})});
    state.order=data.order;
    showOrderConfirmation(data.order);
  }catch(err){toast(err.message||"Order could not be saved. Check that the backend is running.");}
  finally{btn.disabled=false;btn.innerHTML='Place order request <span>↗</span>'}
}
function showOrderConfirmation(order){
  const msg=[
    "Hi! Hi! I want to proceed with my GiftMagzz magazine order.",
    `Order ID: ${order.orderId}`,`Name: ${order.customerName}`,`Pages: ${order.pages}`,
    `Theme: ${order.theme}`,`Magazine price: ${money(order.magazinePrice)}`,
    `Shipping: ${money(order.shippingCost)}`,`Total: ${money(order.total)}`,
    `50% advance: ${money(order.advanceAmount)}`,`Remaining after preview: ${money(order.remainingAmount)}`,
    "Please share the next steps for photos, content and advance payment."
  ].join("\n");
  const wa=WHATSAPP_NUMBER!=="YOUR_WHATSAPP_NUMBER"&&/^\d{8,15}$/.test(WHATSAPP_NUMBER);
  const waHref=wa?`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`:"#";
  const overlay=document.createElement("div");overlay.className="confirmation-overlay";
  overlay.innerHTML=`<section class="confirmation-card"><button class="drawer-close confirm-close" aria-label="Close">×</button><div class="confirm-symbol">✓</div><div class="eyebrow">ORDER REQUEST RECEIVED</div><h2>Thank you, ${safe(order.customerName)}.</h2><p class="confirm-intro">Your request is saved. Continue on WhatsApp to discuss your photos, content and design requirements.</p><div class="confirm-details"><div><span>Order ID</span><strong>${safe(order.orderId)}</strong></div><div><span>Pages</span><strong>${order.pages} pages</strong></div><div><span>Theme</span><strong>${safe(order.theme)}</strong></div><div><span>Magazine</span><strong>${money(order.magazinePrice)}</strong></div><div><span>Shipping</span><strong>${money(order.shippingCost)}</strong></div><div class="confirm-total"><span>Total</span><strong>${money(order.total)}</strong></div><div><span>50% advance</span><strong>${money(order.advanceAmount)}</strong></div><div><span>Remaining after preview</span><strong>${money(order.remainingAmount)}</strong></div></div><p class="confirm-payment">Order request only — payment has not been collected. No COD. Shipping ₹150 across India.</p><div class="confirm-actions"><a class="button ${wa?"":"button-disabled"}" id="waOrder" href="${waHref}" ${wa?'target="_blank" rel="noopener"':""}>Continue on WhatsApp ↗</a><button class="button button-outline" id="confirmBack">Back to home</button></div>${wa?"":'<p class="form-message">Set your WhatsApp number in frontend/app.js before using the WhatsApp button.</p>'}</section>`;
  document.body.appendChild(overlay);overlay.querySelector(".confirm-close").onclick=()=>overlay.remove();overlay.querySelector("#confirmBack").onclick=()=>{overlay.remove();window.scrollTo({top:0,behavior:"smooth"})};
  if(!wa)overlay.querySelector("#waOrder").onclick=e=>{e.preventDefault();toast("Set WHATSAPP_NUMBER in app.js first.")};
}
document.addEventListener("click",e=>{
  const auth=e.target.closest("[data-auth]");if(auth){openAuth(auth.dataset.auth);return}
  const tab=e.target.closest("[data-auth-tab]");if(tab){setAuthMode(tab.dataset.authTab);return}
  const page=e.target.closest("[data-pages]");if(page){state.pages=Number(page.dataset.pages);render();return}
  const theme=e.target.closest("[data-theme]");if(theme){state.theme=theme.dataset.theme;render();if(theme.classList.contains("theme-card"))$("#order").scrollIntoView({behavior:"smooth"});return}
});
$("#closeDrawer").addEventListener("click",closeAuth);$("#drawerBackdrop").addEventListener("click",closeAuth);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeAuth()});
$("#authForm").addEventListener("submit",submitAuth);$("#placeOrder").addEventListener("click",placeOrder);
$("#startOrder").addEventListener("click",()=>$("#order").scrollIntoView({behavior:"smooth"}));
$("#themesOrder").addEventListener("click",()=>$("#order").scrollIntoView({behavior:"smooth"}));
$("#closingOrder").addEventListener("click",()=>$("#order").scrollIntoView({behavior:"smooth"}));
$("#mobileMenu").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$("#mainNav").addEventListener("click",e=>{if(e.target.closest("a"))$("#mainNav").classList.remove("open")});
$("#year").textContent=new Date().getFullYear();
render();
