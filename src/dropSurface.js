export default function (el, cb) {
  el.addEventListener('drop', (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    else cb(file)
  }, false)
  el.addEventListener('dragover', (e) => { e.preventDefault() })
}
