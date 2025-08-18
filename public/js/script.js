document.addEventListener('DOMContentLoaded', function () {
  adjustFooter();
  window.addEventListener('resize', adjustFooter);
});

let slideIndex = 0;
showSlides();

function showSlides() {
  let i;
  const slides = document.getElementsByClassName("mySlides");
  const dots = document.getElementsByClassName("dot");
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  slideIndex++;
  if (slideIndex > slides.length) {slideIndex = 1}    
  for (i = 0; i < dots.length; i++) {
    dots[i].classList.remove("active");
  }
  slides[slideIndex-1].style.display = "block";  
  dots[slideIndex-1].classList.add("active");
  setTimeout(showSlides, 3000);
}


function adjustFooter() {
  const main = document.getElementById('family-main');
  const footer = document.querySelector('footer');

  if (!main || !footer) {
    console.log('Main or footer not found');
    return;
  }

  // Get total content height *excluding* the margin we're going to set
  const contentHeight = main.offsetTop + main.offsetHeight;
  const viewportHeight = window.innerHeight;

  console.log({ contentHeight, viewportHeight });

  if (contentHeight + footer.offsetHeight < viewportHeight) {
    const extraSpace = viewportHeight - (contentHeight + footer.offsetHeight);
    footer.style.marginTop = `${extraSpace}px`;
  } else {
    footer.style.marginTop = '20px';
  }
}
