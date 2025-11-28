
// seller-widget.js
(function(){
  const floatingBtn = document.getElementById('sellerFloatingBtn')
  const modal = document.getElementById('sellerModal')
  const backdrop = document.getElementById('sellerBackdrop')
  const closeBtn = document.getElementById('closeSellerModal')
  const form = document.getElementById('sellerForm')
  const productImagesInput = document.getElementById('productImages')
  const imagePreview = document.getElementById('imagePreview')
  const publishDateInput = document.getElementById('publishDate')
  const expireDateInput = document.getElementById('expireDate')
  const clearBtn = document.getElementById('clearForm')
  const userProductsContainer = document.getElementById('user_products')

  // Compute publish and expiry dates
  function formatDate(d){
    return d.toLocaleDateString('ar-EG')
  }
  const today = new Date()
  publishDateInput.value = formatDate(today)
  const expire = new Date(today.getFullYear(), today.getMonth()+3, today.getDate())
  expireDateInput.value = formatDate(expire)

  function openModal(){
    modal.classList.add('open')
    modal.setAttribute('aria-hidden','false')
  }
  function closeModal(){
    modal.classList.remove('open')
    modal.setAttribute('aria-hidden','true')
  }

  floatingBtn.addEventListener('click', openModal)
  closeBtn.addEventListener('click', closeModal)
  backdrop.addEventListener('click', closeModal)

  // Images preview with swipe
  let imagesData = [] // array of dataURLs
  let currentIndex = 0
  function renderPreview(){
    imagePreview.innerHTML = ''
    if(imagesData.length === 0){
      imagePreview.innerHTML = '<div class="empty">لا توجد صور</div>'
      return
    }
    const track = document.createElement('div')
    track.className = 'track'
    imagesData.forEach(src => {
      const slide = document.createElement('div')
      slide.className = 'slide'
      const img = document.createElement('img')
      img.src = src
      slide.appendChild(img)
      track.appendChild(slide)
    })
    imagePreview.appendChild(track)
    // set translate
    track.style.transform = `translateX(${ - currentIndex * 100 }%)`
  }

  // touch support
  let startX = 0, dx = 0, dragging = false
  imagePreview.addEventListener('touchstart', (e)=>{
    if(imagesData.length <=1) return
    startX = e.touches[0].clientX
    dragging = true
  }, {passive:true})
  imagePreview.addEventListener('touchmove', (e)=>{
    if(!dragging) return
    dx = e.touches[0].clientX - startX
    const track = imagePreview.querySelector('.track')
    if(track) track.style.transform = `translateX(${ - currentIndex * 100 + dx / imagePreview.clientWidth * 100 }%)`
  }, {passive:true})
  imagePreview.addEventListener('touchend', (e)=>{
    if(!dragging) return
    dragging = false
    if(Math.abs(dx) > 40){
      if(dx < 0 && currentIndex < imagesData.length -1) currentIndex++
      if(dx > 0 && currentIndex > 0) currentIndex--
    }
    dx = 0
    renderPreview()
  })

  // keyboard arrows
  imagePreview.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowLeft' && currentIndex > 0){ currentIndex--; renderPreview() }
    if(e.key === 'ArrowRight' && currentIndex < imagesData.length-1){ currentIndex++; renderPreview() }
  })

  productImagesInput.addEventListener('change', (e)=>{
    const files = Array.from(e.target.files).slice(0,8) // limit
    imagesData = []
    if(files.length === 0){ renderPreview(); return }
    let loaded = 0
    files.forEach((file, idx)=>{
      const reader = new FileReader()
      reader.onload = function(ev){
        imagesData.push(ev.target.result)
        loaded++
        if(loaded === files.length){
          currentIndex = 0
          renderPreview()
        }
      }
      reader.readAsDataURL(file)
    })
  })

  // persist user products to localStorage
  function loadProducts(){
    try{
      return JSON.parse(localStorage.getItem('userProducts') || '[]')
    }catch(e){ return [] }
  }
  function saveProducts(list){
    localStorage.setItem('userProducts', JSON.stringify(list))
  }

  function renderProducts(){
    const list = loadProducts()
    userProductsContainer.innerHTML = ''
    if(list.length === 0){
      userProductsContainer.innerHTML = '<p style="text-align:center;color:#666">لم يتم نشر أي منتجات بعد.</p>'
      return
    }
    list.slice().reverse().forEach(p=>{
      const card = document.createElement('article')
      card.className = 'user-product-card'
      const thumb = document.createElement('div')
      thumb.className = 'thumb'
      const img = document.createElement('img')
      img.alt = p.name || 'thumb'
      img.src = (p.images && p.images[0]) || p.placeholder || ''
      thumb.appendChild(img)

      const info = document.createElement('div')
      info.className = 'info'
      const title = document.createElement('h4')
      title.textContent = p.name || p.description.substring(0,40) + '...'
      const desc = document.createElement('p')
      desc.textContent = p.description
      const meta = document.createElement('div')
      meta.className = 'meta'
      meta.innerHTML = `
        البائع: ${p.seller}<br>
        الموقع: ${p.location || '-'} · الهاتف: ${p.phone || '-'} · واتس: ${p.whatsapp || '-'}<br>
        نشر: ${p.publishDate} · إنتهاء: ${p.expireDate}
      `
      info.appendChild(title); info.appendChild(desc); info.appendChild(meta)

      card.appendChild(thumb); card.appendChild(info)

      userProductsContainer.appendChild(card)
    })
  }

  // initialize render
  renderProducts()
  renderPreview()

  form.addEventListener('submit', (e)=>{
    e.preventDefault()
    const seller = document.getElementById('sellerName').value.trim() || 'مجهول'
    const description = document.getElementById('productDesc').value.trim() || ''
    const location = document.getElementById('productLocation').value.trim() || ''
    const phone = document.getElementById('productPhone').value.trim() || ''
    const whatsapp = document.getElementById('productWhatsapp').value.trim() || ''
    const call = document.getElementById('productCall').value

    const publishDate = publishDateInput.value
    const expireDate = expireDateInput.value

    const product = {
      id: Date.now(),
      seller, description, location, phone, whatsapp, call,
      publishDate, expireDate,
      images: imagesData.slice(0,8)
    }

    const list = loadProducts()
    list.push(product)
    saveProducts(list)
    renderProducts()
    // reset
    form.reset()
    imagesData = []
    renderPreview()
    // update dates again
    const now = new Date()
    publishDateInput.value = now.toLocaleDateString('ar-EG')
    const exp = new Date(now.getFullYear(), now.getMonth()+3, now.getDate())
    expireDateInput.value = exp.toLocaleDateString('ar-EG')
    closeModal()
    // focus user products
    setTimeout(()=>{ userProductsContainer.scrollIntoView({behavior:'smooth'}) }, 300)
  })

  clearBtn.addEventListener('click', ()=>{
    form.reset()
    imagesData = []
    renderPreview()
    const now = new Date()
    publishDateInput.value = now.toLocaleDateString('ar-EG')
    const exp = new Date(now.getFullYear(), now.getMonth()+3, now.getDate())
    expireDateInput.value = exp.toLocaleDateString('ar-EG')
  })

  // simple cleanup: remove expired items older than expireDate
  (function removeExpired(){
    try{
      const list = loadProducts()
      const today = new Date()
      const filtered = list.filter(p=>{
        const parts = p.expireDate.split('/')
        // exp format depends on locale; attempt parsing by Date.parse fallback
        const d = new Date(p.expireDate)
        if(!isNaN(d)) return d >= today
        // if failed, keep items (safer)
        return true
      })
      if(filtered.length !== list.length) saveProducts(filtered)
    }catch(e){}
  })()

})();
