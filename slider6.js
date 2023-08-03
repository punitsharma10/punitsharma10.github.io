let slider6 = document.querySelector('.slider6 .list6');
let items6 = document.querySelectorAll('.slider6 .list6 .item6');
let next6 = document.getElementById('next6');
let prev6 = document.getElementById('prev6');
let dots6 = document.querySelectorAll('.slider6 .dots6 li');

let lengthItems6 = items6.length - 1;
let active6 = 0;
next6.onclick = function(){
    active6 = active6 + 1 <= lengthItems6 ? active6 + 1 : 0;
    reloadSlider6();
}
prev6.onclick = function(){
    active6 = active6 - 1 >= 0 ? active6 - 1 : lengthItems6;
    reloadSlider6();
}

function reloadSlider6(){
    slider6.style.left = -items6[active6].offsetLeft + 'px';
    // 
    let last_active6_dot = document.querySelector('.slider6 .dots6 li.active6');
    last_active6_dot.classList.remove('active6');
    dots6[active6].classList.add('active6');

    
}

dots6.forEach((li, key) => {
    li.addEventListener('click', ()=>{
         active6 = key;
         reloadSlider6();
    })
})
window.onresize = function(event) {
    reloadSlider6();
};
