
package;
import Config.*;

enum ManMouseState {
    IDLE;
    OVER;
    SELECTED;
}


class Manu extends h2d.Object {

    var app: MainApp;
    var mousestate: ManMouseState;
    var graphic: h2d.Graphics;
    var interact: h2d.Interactive;

    public function new( x ,y ,scene:h2d.Scene)  {
       super(scene);
       this.x=x;
       this.y=y;
       this.mousestate = IDLE;

       graphic = new h2d.Graphics(this);
       interact = new h2d.Interactive(20,20,this);
       interact.x=-10;
       interact.y=-10;
       interact.onOver =this.onOver;
       interact.onOut =this.onOut;
       interact.onPush =this.onPush;
       interact.onRelease =this.onRelease;

       redraw();

    }

     public function update(dt:Float) {
        
        if(mousestate==SELECTED){
            x=getScene().mouseX;
            y=getScene().mouseY;
        }
    }

    function redraw(){
        graphic.clear();
        switch (mousestate) {
            case OVER: 
                graphic.beginFill(colorOver);
            case SELECTED: 
                graphic.beginFill(colorSelected);
            default: 
                graphic.beginFill(colorPrimary);
        }
        
        graphic.drawCircle(0,0,10);
        graphic.endFill();

    }

    function onOver(e:hxd.Event) {
        if (mousestate != SELECTED){
        mousestate = OVER;
        redraw();
        }

    }

    function onOut(e:hxd.Event) {
        if (mousestate != SELECTED){
        mousestate = IDLE;
        redraw();
        }

    }

    function onPush(e:hxd.Event) {

        mousestate = SELECTED;
        redraw();

    }

    function onRelease(e:hxd.Event) {

        mousestate = IDLE;
        redraw();

    }

    
}