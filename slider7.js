// let slider7 = document.querySelector('.slider7 .list7');
// let items7 = document.querySelectorAll('.slider7 .list7 .item7');
// let next7 = document.getElementById('next7');
// let prev7 = document.getElementById('prev7');
// let dots7 = document.querySelectorAll('.slider7 .dots7 li');

// let lengthItems7 = items7.length - 1;
// let active7 = 0;
// next7.onclick = function(){
//     active7 = active7 + 1 <= lengthItems7 ? active7 + 1 : 0;
//     reloadSlider7();
// }
// prev7.onclick = function(){
//     active7 = active7 - 1 >= 0 ? active7 - 1 : lengthItems7;
//     reloadSlider7();
// }

// function reloadSlider7(){
//     slider7.style.left = -items7[active7].offsetLeft + 'px';
//     // 
//     let last_active7_dot = document.querySelector('.slider7 .dots7 li.active7');
//     last_active7_dot.classList.remove('active7');
//     dots7[active7].classList.add('active7');

    
// }

// dots7.forEach((li, key) => {
//     li.addEventListener('click', ()=>{
//          active7 = key;
//          reloadSlider7();
//     })
// })
// window.onresize = function(event) {
//     reloadSlider7();
// };
