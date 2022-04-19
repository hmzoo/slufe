package;

class ManuGroup {
	public var group:Array<Manu>;
	var manuscene:ManuScene;

	public function new(scene:ManuScene) {
		this.manuscene = scene;
		this.group = new Array<Manu>();
	}

	public function Add(x, y) {
		group.push(new Manu(x, y, manuscene));
	}

	public function update(dt:Float) {
		for (m in group) {
			m.update(dt);
		}
	}
}
