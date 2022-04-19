package;

import Config.*;

class ManuScene extends h2d.Scene {
	var background:h2d.Bitmap;
	var interact:h2d.Interactive;
	var manugroup:ManuGroup;
	var graphic:h2d.Graphics;

	public function new() {
		super();
		background = new h2d.Bitmap(h2d.Tile.fromColor(colorBackground, this.width, this.height), this);
		interact = new h2d.Interactive(this.width, this.height, this);
		interact.onPush = this.onPush;

		graphic = new h2d.Graphics(this);
	}

	public function SetManuGroup(mg:ManuGroup) {
		manugroup = mg;
	}

	public function redraw() {
		background.width = this.width;
		background.height = this.height;
		interact.width = this.width;
		interact.height = this.height;

		graphic.clear();
		graphic.beginFill(colorGraphics);
		
        for (k => m in manugroup.group) {
            if (k == 0){
                graphic.moveTo(m.x,m.y);   
            }else{
            graphic.lineTo(m.x,m.y); 
            }
        }
        graphic.lineTo(manugroup.group[0].x,manugroup.group[0].y);
		graphic.endFill();
	}

	function onPush(e:hxd.Event) {
		manugroup.Add(mouseX, mouseY);
	}

	public function update(dt:Float) {
        redraw();
    }
}
