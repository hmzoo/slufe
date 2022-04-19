


class Pan extends h2d.Object {

    var app: MainApp;

    public function new( x ,y )  {
       super(MainApp.inst.s2d);
       this.x=x;
       this.y=y;

       var g = new h2d.Graphics(this);
       g.beginFill(0xFF0000);
       g.drawRect(50,100,150,150);
       g.endFill();

    }
    
}