// The generation tells a restarted server from a still-running one: node
// --watch drops the stream when it restarts, and the reconnection is the only
// notice a page gets that the code serving it has been replaced.
const source = new EventSource("/-/reload")

let generation = null

source.addEventListener("hello", function (event) {
  if (generation != null && generation != event.data) {
    location.reload()
  }

  generation = event.data
})

source.addEventListener("change", function () {
  location.reload()
})
