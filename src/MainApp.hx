package;

import Config.*;

class  MainApp  extends hxd.App {

 
    var mg:ManuGroup;
    var ms:ManuScene;

    override  function  init() {
        ms= new ManuScene();
        s2d.addChild(ms);
        mg=new ManuGroup(ms);
        ms.SetManuGroup(mg);
        mg.Add(100,100);
        mg.Add(50,200);
        

    }

    override function update(dt:Float) {
     
        mg.update(dt);
        ms.update(dt);
        
    }

    override function onResize() {
 
        ms.redraw();
        
    }


    public static var inst : MainApp;

    static  function  main() {
        inst=new  MainApp();
    }
  }