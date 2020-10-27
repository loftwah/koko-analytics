(function() {
  const global = window.koko_analytics

  function getCookie (name) {
    if (!document.cookie) {
      return ''
    }

    const cookies = document.cookie.split('; ')
    let parts
    for (let i = 0; i < cookies.length; i++) {
      parts = cookies[i].split('=')
      if (parts[0] === name) {
        return decodeURIComponent(parts[1])
      }
    }

    return ''
  }

  function setCookie (name, data, expires) {
    name = window.encodeURIComponent(name)
    data = window.encodeURIComponent(String(data))
    let str = name + '=' + data
    str += ';path=' + global.cookie_path + ';SameSite=Lax;expires=' + expires.toUTCString()
    document.cookie = str
  }

  global.track = function (args) {
    // TODO: Make postID required if supplying function arguments
    args = args || {};

    // do not track if "Do Not Track" is enabled
    if ('doNotTrack' in navigator && navigator.doNotTrack === '1' && global.honor_dnt) {
      return
    }

    // do not track if this is a prerender request
    if ('visibilityState' in document && document.visibilityState === 'prerender') {
      return
    }

    // do not track if user agent looks like a bot
    if ((/bot|crawler|spider|crawling|seo|chrome-lighthouse/i).test(navigator.userAgent)) {
      return
    }

    // do not track if page is inside an iframe
    if (window.location !== window.parent.location) {
      return
    }

    const postId = args.postId !== undefined ? String(args.postId) : String(global.post_id)
    const cookie = global.use_cookie ? getCookie('_koko_analytics_pages_viewed') : ''
    let newVisitor = args.newVisitor !== undefined ? args.newVisitor : cookie.length === 0
    const pagesViewed = cookie.split(',').filter(function (id) {
      return id !== ''
    })
    let uniquePageview = args.uniquePageview !== undefined ? args.uniquePageview : pagesViewed.indexOf(postId) === -1
    let referrer = args.referrer || '';

    // add referrer if not from same-site & try to detect returning visitors from referrer URL (but only if called without arguments)
    if (args.postId === undefined && typeof (document.referrer) === 'string' && document.referrer !== '') {
      if (document.referrer.indexOf(window.location.origin) === 0) {
        newVisitor = false // referred by same-site, so not a new visitor

        if (document.referrer === window.location.href) {
          uniquePageview = false // referred by same-url, so not a unique pageview
        }
      } else {
        referrer = document.referrer // referred by external site, so send referrer URL to be stored
      }
    }

    const img = document.createElement('img')
    img.style.display = 'none'
    img.onload = function () {
      document.body.removeChild(img)

      if (global.use_cookie) {
        if (pagesViewed.indexOf(postId) === -1) {
          pagesViewed.push(postId)
        }
        const expires = new Date()
        expires.setHours(expires.getHours() + 6)
        setCookie('_koko_analytics_pages_viewed', pagesViewed.join(','), expires)
      }
    }

    // build tracker URL
    let queryStr = ''
    queryStr += 'p=' + postId
    queryStr += '&nv=' + (newVisitor ? '1' : '0')
    queryStr += '&up=' + (uniquePageview ? '1' : '0')
    queryStr += '&r=' + encodeURIComponent(referrer)
    img.src = global.tracker_url + (global.tracker_url.indexOf('?') > -1 ? '&' : '?') + queryStr

    // add to DOM to fire request
    document.body.appendChild(img)
  }
}())

/**
 * @package koko-analytics
 * @author Danny van Kooten
 * @license GPL-3.0+
 */
window.addEventListener('load', function()  {
  window.koko_analytics.track()
})
