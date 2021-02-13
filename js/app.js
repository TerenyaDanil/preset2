////////////////////////////////////////////////////////////////////////////////////////

const anchors = document.querySelectorAll('a.scroll-to')

for (let anchor of anchors) {
    anchor.addEventListener('click', function (e) {
        e.preventDefault()

        const blockID = anchor.getAttribute('href')

        document.querySelector(blockID).scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        })
    })
}


console.log(123)



let header = gsap.timeline({
    scrollTrigger: {
        trigger: ".header",   // pin the trigger element while active
        start: "top center",

    }
});


if (window.innerWidth > 737) {

    header
        .from(".header__title", { duration: 0.7, ease: "power4.out", opacity: 0, x: 100 }, "0")
        .from(".header__subtitle", { duration: 0.7, ease: "power4.out", opacity: 0, x: 100 }, "-=0.4")
        .from(".header__text", { duration: 0.7, ease: "power4.out", opacity: 0, x: 100 }, "-=0.4")


} else {
    header
        .from(".header__title", { duration: 0.7, ease: "power4.out", opacity: 0, y: 50 }, "0")
        .from(".header__subtitle", { duration: 0.7, ease: "power4.out", opacity: 0, y: 50 }, "-=0.4")
        .from(".header__text", { duration: 0.7, ease: "power4.out", opacity: 0, y: 50 }, "-=0.4")

}


let photo = gsap.timeline({
    scrollTrigger: {
        trigger: ".photo__inner",   // pin the trigger element while active
        start: "top center",

    }
});


photo.from(".inner-photo__item", { duration: 0.7, ease: "power4.out", opacity: 0, y: 100, stagger: 0.3 }, "0")



