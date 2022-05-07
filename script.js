class Slider{
    constructor({
        slider = '.slider',
        sliderLines = '.slider__lines',
        sliderItem = '.slider__item',
        duration = 400,//Скорость перемещения слайда от одного к другому (миллисекунды)
        direction = 'x',//Горизонтальная прокрутка слайдов по оси x (будет и вертикальная 'y')
        slidesToMove = 1, //Сколько слайдов перелистовать за 1 раз
        slidesToShow = 1,//Сколько слайдов показывать за 1 раз
        margin = 0,//отступы между слайдами (по умолчанию без отступов - 0px)
        active = 0,//данный открытый слайд по умолчанию
        buttons = false,//Включение и отключение кнопок перелистывания
        pagination = false,//пагинация для сайта. Включить либо выключить
        breakpoints //адаптация для маленьких дисплеев
    })
    {
        // console.log(this); //будет отдавать сам класс
        this.slider = typeof slider == 'string' ? document.querySelector(slider) : slider;
        this.sliderLines = typeof sliderLines == 'string' ? this.slider.querySelector(sliderLines) : sliderLines;
        this.sliderItems = typeof sliderItem == 'string' ? [...this.slider.querySelectorAll(sliderItem)] : sliderItem;
        this.duration = duration <= 0 ? 400 : duration;//Если скорость будет отрицательным значением или равна 0, то по умолчанию она будет равна 400 миллисекунд или если все правильно то будет заданна скорость пользователя
        this.direction = direction.toUpperCase();//Двигаться слайды будут благодаря transform: translateX,Y. X и Y пишутся всегда с заглавной буквы, поэтому если пользователь ввел ось с строчной буквы, надо перестраховаться чтобы она была всегда с заглавной. Поэтому пишем direction.toUpperCase()
        this.slidesToMove = slidesToMove <= 0 || slidesToMove >= this.sliderItems.length - 1 ? 1 : slidesToMove; //Если при перемотке пользователь задаст число 0 или отрицательное число или же число равное или число более кол-ва слайдов, то перемотка по умолчанию будет равна 1, если все будет в норме, то пользователь сможет перематывать слайды например через 1 или через 3
        this.margin = margin <= 0 ? 0 : margin;//отступ не может быть отрицательным, иначе будет равен 0
        this.active = active < 0 || active > this.sliderItems.length - 1 ? 0 : active;
        this.slidesToShow = slidesToShow > 0 && slidesToShow <= this.sliderItems.length ? slidesToShow : 1;  //Показать за раз можно будет только столько слайдов за раз сколько их имеется в принципе. Иначе будет 1 слайд
        this.sliderTrueSize = this.slider.querySelector('.slider__true-size');
        this.buttons = buttons;
        this.pagination = pagination;
        //созданные 3 переменные служат для обработки куда нажал пользователь, куда потянул пользователь и тд
        this.posX1 = 0; //создаст координату при клике на слайдер, при это изменится только при повторном нажатии в другой области слайда
        this.posX2 = 0;//создаст координату которая будет изменяться ппо оси Х при этом обновляться автоматически при движении мыши
        this.posInit = 0; //это переменная будет разницей между posX2 и posX1. При этом она так же будет изменяться при движении мыши. х1 - х2 = разница прокрутки слайда в определенную от перетягивания сторону
        this.breakpoints = breakpoints;//регулировка настроек в зависимости от дисплея
        this.copySlider = {}; //переменная для создания резервной копии, чтобы вернуть размеры и настройки после уменьшения дисплея в стандартные
        for (const key in this) {
            this.copySlider[key] = this[key];
        }
          //все что находится внутри if(this.buttons) было автономно и переместилось в if(). Это используется для пагинации и в будущем для смахивания пальцем
        if(this.buttons){
            this.prev = this.slider.querySelector('.slider__prev');
            this.next = this.slider.querySelector('.slider__next');
            //Добавляем нажатие кнопкам. При нажатии перелистывают слайдер
            this.prev.addEventListener('click', ()=> this.movePrevious());
            this.next.addEventListener('click', ()=> this.moveNext());
            this.disableButtons();
        }
        //пишем условие для пагинации
        if(this.pagination){
            this.navigation = this.slider.querySelector('.slider__pagination');
            this.navigation.innerHTML = '';
            for (let i = 0; i < this.sliderItems.length; i++) {
                this.navigation.innerHTML += '<li></li>';
            }
            this.bullets = [...this.navigation.children];
            this.bullets.forEach(item => {
                item.addEventListener('click',(e) => this.bulletsClick(e));
            })
        }
        this.basicStyles();
        this.setClass();
        //адаптировал с помощью события resize - изменяет размер
        window.addEventListener('resize', () => this.basicStyles());
        //перемотка с помощью перетягивания клика мыши слайдов и с помощью пальца
        this.slider.addEventListener('mousedown', this.touchStart);
        this.slider.addEventListener('touchstart', this.touchStart);
    }
    basicStyles(){
        //дает стили элементам обрезая их если они
        this.slider.style.overflow = 'hidden';
        this.sliderLines.style.overflow = 'hidden';
        this.sliderTrueSize.style.overflow = 'hidden';
        this.sliderLines.style.display = 'flex'; // даем дисплей флекс элементам чтобы показывались более 1 за раз
        if(this.breakpoints){
            let sorting = (a, b) => a - b;
            let keys = Object.keys(this.breakpoints).sort(sorting).reverse();
            keys.push(0); //Добавляем 0 в конец объекта чтобы при минимальном разрешении экрана например 450 экран был менее 450 и более ???. Для этого базовое значение будет 0! 450 > 320 && 320 > 0
            // console.log(keys);
           for (let i = 0; i < keys.length; i++) {
              if(window.innerWidth <= keys[i] && window.innerWidth > keys[i+1]){
                  for (const id in this.breakpoints[keys[i]]) {
                     this[id] = this.breakpoints[keys[i]][id];
                  }
              }
              else if(window.innerWidth > keys[0]){
                for (const id in this.breakpoints[keys[i]]) {
                    this[id] = this.copySlider[id];
                 }
              }
           }
        }
        this.sliderItems.forEach(item => {
            if(this.direction == 'Y') item.style.paddingBottom = this.margin + 'px';// если ось Y то отступы действуют вниз
            else {
                item.style.paddingRight = this.margin + 'px';// Иначе если ось Х то отступы действуют направо
                item.style.width = this.sliderTrueSize.offsetWidth / this.slidesToShow + 'px';// ширина экрана и контента естественно уменьшается, то есть делится на столько сколько картинок передается за 1 раз. Если передано 3 картинки, то они будут в 3 раза меньше от ширины картинки
            }
        })
        //условия для оси Y
        // если ось Y то будет вертикальная прокрутка, иначе горизонтальная
        if(this.direction == 'Y'){
            this.sliderLines.style.flexDirection = 'column';
            this.sliderTrueSize.style.height = this.sliderItems[this.active].offsetHeight * this.slidesToShow +'px';
            this.sliderLines.style.height = this.sliderLines.scrollHeight + 'px';
        }
        else this.sliderLines.style.width = this.sliderLines.scrollWidth + 'px';
        this.sliderLines.style.transition = `${this.duration}ms`;//задает время перехода анимации
        this.sliderLines.style.transform = `translate${this.direction}(${-this.slidesToMoving()}px)`; //обращается к функции slidesToMoving() чтобы слайды во время перехода поднимались на нужную высоту или ширину в зависимости от оси
    }
    slidesToMoving(){
        let limit = this.sliderItems[this.active].offsetWidth;        
        let limit2 = this.sliderItems[this.active].offsetHeight;        
        return (this.direction == 'Y') ? limit2 * this.active : limit * this.active;
    }
      //Функция для перемотки кнопок
    movePrevious(){
        if(this.active - this.slidesToMove >= 0) this.active -= this.slidesToMove;//если в запасе при перемотке назад нескольких слайдов например 2-ух есть в наличии 2 картинки то он по перемотает сразу 2 картинки
        else this.active--;//если картинок меньше чем заданно количество при перемотке то будет перематывать по 1 картинке назад
        if(this.active < 0) this.active = 0; //если слайд стоит в самом начале, то его нельзя будет перематывать назад дальше. Только вперед
        if(this.buttons) this.disableButtons();
        this.setClass();
        this.sliderLines.style.transform = `translate${this.direction}(${-this.slidesToMoving()}px)`;
    }
    moveNext(){
        if(this.active + this.slidesToMove < this.sliderItems.length+1) this.active += this.slidesToMove; //если в запасе при перемотке вперед нескольких слайдов например 2-ух есть в наличии 2 картинки то он по перемотает сразу 2 картинки
        else this.active++;//если картинок меньше чем заданно количество при перемотке то будет перематывать по 1 картинке вперед
        if(this.active >= this.sliderItems.length -1) this.active = this.sliderItems.length-1;//если слайд стоит в самом конце, то его нельзя будет перематывать вперед дальше. Только назад
        if(this.buttons) this.disableButtons();
        this.setClass();
        this.sliderLines.style.transform = `translate${this.direction}(${-this.slidesToMoving()}px)`;
    }
    bulletsClick(e){
        // console.log(e.target);
        let index = this.bullets.indexOf(e.target);
        this.active = index;
        this.setClass();
        if(this.buttons) this.disableButtons();
        this.sliderLines.style.transform = `translate${this.direction}(${-this.slidesToMoving()}px)`;
    }
    //функция блокирует кнопки если открыт первый или последний слайд, а так же при перезагрузке если он стоит на 1 слайде
    disableButtons(){
        if(this.active <= 0) this.prev.disabled = true;
        else this.prev.disabled = false;
        if(this.active >= this.sliderItems.length -1) this.next.disabled = true;
        else this.next.disabled = false;
    }
    setClass(){
        this.sliderItems.forEach((item, i) => {
            item.classList.remove('active');
            item.classList.remove('prev');
            item.classList.remove('next');
            if(this.pagination) this.bullets[i].classList.remove('active');
        })
        this.sliderItems[this.active].classList.add('active');
        if(this.pagination) this.bullets[this.active].classList.add('active');
        if(this.sliderItems[this.active].previousElementSibling){
            this.sliderItems[this.active].previousElementSibling.classList.add('prev');
        }
        if(this.sliderItems[this.active].nextElementSibling){
            this.sliderItems[this.active].nextElementSibling.classList.add('next');
        }
    }
    touchStart = (e) => {
       if(e.type == 'touchstart') this.posX1 = this.direction == 'X' ? e.touches[0].clientX : e.touches[0].clientY;//для пальца (сенсора) e.touches[0], где [0] это первый палец, 1 это второй. Если клик будет одновременно несколькими пальцами то будет выполнен только первый
       else this.posX1 = this.direction == 'X' ? e.clientX : e.clientY;//для мышки
        // console.log(this.posX1);
       document.addEventListener('touchmove', this.touchMove);
       document.addEventListener('mousemove', this.touchMove);
       document.addEventListener('touchend', this.touchEnd);
       document.addEventListener('mouseup', this.touchEnd);
    }
    touchMove = (e) => {
        if(e.type == 'touchmove') this.posX2 = this.direction == 'X' ? e.changedTouches[0].clientX : e.changedTouches[0].clientY;
        else this.posX2 = this.direction == 'X' ? e.clientX : e.clientY;
        // console.log(this.posX1, this.posX2);
        this.posInit = this.posX2 - this.posX1;
        // console.log(this.posInit);
        this.sliderLines.style.transition = '0ms';//убираем плавность при перетягивании слайда
        this.sliderLines.style.transform = `translate${this.direction}(${-this.slidesToMoving() + this.posInit}px)`;
    }
    touchEnd = () => {
        this.sliderLines.style.transition = `${this.duration}ms`;
        let end = this.direction == 'Y' ? this.slider.clientHeight / 100 * 25 : this.slider.clientWidth / 100 * 25;
        if(this.posInit > end) this.movePrevious();
        else if(this.posInit < -end) this.moveNext();
        else {
            this.sliderLines.style.transform = `translate${this.direction}(${-this.slidesToMoving()}px)`;
        }
        this.posX1 = 0;
        this.posX2 = 0;
        this.posInit = 0;
        document.removeEventListener('touchmove', this.touchMove);
        document.removeEventListener('mousemove', this.touchMove);
        document.removeEventListener('touchend', this.touchEnd);
        document.removeEventListener('mouseup', this.touchEnd);
    }
}


const mySlider = new Slider({
    slider: '.slider',
    sliderLines: '.slider__lines',
    sliderItem: '.slider__item',
    direction: 'x',
    duration: 400,
    active: 0,
    slidesToMove: 1,
    slidesToShow: 1,
    margin: 0,
    buttons: true,
    pagination: true,
    breakpoints: {
        800: {
            slidesToShow: 2,
            margin: 0
        },
        450: {
            slidesToShow: 1,
            margin: 0
        },
        1120: {

        },
    }
})
//В breakpoints задается цифра и параметры которые вступят в силу только после того как экран станет меньше в ширину данной цифры







// let sliderNext = document.querySelector('.slider');
// // console.log(this);//будет равен window
// sliderNext.addEventListener('click', (e) => {
//     // console.log(e.target);//может быть вложенным элементом, если он имеется
//     console.log(this);//будет равен самому элементу, при условии что не стрелочная функция
// });