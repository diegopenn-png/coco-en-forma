(function (root) {
  "use strict";

  var C = root.CocoV144;
  if (!C || root.CocoDifferencesProV151) return;

  var SCENES = [{"id":"workshop","title":"El taller mecánico","left":"scenes/scene-workshop-v151-left.webp?v=1510","variants":[{"src":"scenes/scene-workshop-v151-right-1.webp?v=1510","differences":[{"id":"workshop-brain-v1","key":"brain","label":"el color del cerebro de Coco","x":52,"y":31,"w":14,"h":18},{"id":"workshop-toolbox-v1","key":"toolbox","label":"el color de caja de herramientas","x":82.5,"y":62,"w":18,"h":23},{"id":"workshop-mug-v1","key":"mug","label":"el color de taza","x":70,"y":66,"w":10,"h":14},{"id":"workshop-plant-v1","key":"plant","label":"el color de planta","x":9,"y":56,"w":18,"h":29},{"id":"workshop-beak-v1","key":"beak","label":"el color del pico de Coco","x":52,"y":48,"w":11,"h":14},{"id":"workshop-lamp-v1","key":"lamp","label":"el color de lámpara","x":48,"y":10,"w":18,"h":20}]},{"src":"scenes/scene-workshop-v151-right-2.webp?v=1510","differences":[{"id":"workshop-brain-v2","key":"brain","label":"el color del cerebro de Coco","x":52,"y":31,"w":14,"h":18},{"id":"workshop-toolbox-v2","key":"toolbox","label":"el color de caja de herramientas","x":82.5,"y":62,"w":18,"h":23},{"id":"workshop-mug-v2","key":"mug","label":"el color de taza","x":70,"y":66,"w":10,"h":14},{"id":"workshop-plant-v2","key":"plant","label":"el color de planta","x":9,"y":56,"w":18,"h":29},{"id":"workshop-beak-v2","key":"beak","label":"el color del pico de Coco","x":52,"y":48,"w":11,"h":14},{"id":"workshop-lamp-v2","key":"lamp","label":"el color de lámpara","x":48,"y":10,"w":18,"h":20}]},{"src":"scenes/scene-workshop-v151-right-3.webp?v=1510","differences":[{"id":"workshop-brain-v3","key":"brain","label":"el color del cerebro de Coco","x":52,"y":31,"w":14,"h":18},{"id":"workshop-toolbox-v3","key":"toolbox","label":"el color de caja de herramientas","x":82.5,"y":62,"w":18,"h":23},{"id":"workshop-mug-v3","key":"mug","label":"el color de taza","x":70,"y":66,"w":10,"h":14},{"id":"workshop-plant-v3","key":"plant","label":"el color de planta","x":9,"y":56,"w":18,"h":29},{"id":"workshop-beak-v3","key":"beak","label":"el color del pico de Coco","x":52,"y":48,"w":11,"h":14},{"id":"workshop-lamp-v3","key":"lamp","label":"el color de lámpara","x":48,"y":10,"w":18,"h":20}]}]},{"id":"invention-lab","title":"El laboratorio de inventos","left":"scenes/scene-invention-lab-v151-left.webp?v=1510","variants":[{"src":"scenes/scene-invention-lab-v151-right-1.webp?v=1510","differences":[{"id":"invention-lab-brain-v1","key":"brain","label":"el color del cerebro de Coco","x":38,"y":43,"w":14,"h":18},{"id":"invention-lab-controls-v1","key":"controls","label":"el color de luces drobot","x":50,"y":73,"w":12,"h":12},{"id":"invention-lab-toolbox-v1","key":"toolbox","label":"el color de caja de herramientas","x":83,"y":73,"w":20,"h":22},{"id":"invention-lab-lamp-v1","key":"lamp","label":"el color de lámpara","x":31,"y":11,"w":16,"h":21},{"id":"invention-lab-beak-v1","key":"beak","label":"el color del pico de Coco","x":38,"y":57,"w":11,"h":14},{"id":"invention-lab-cup-v1","key":"cup","label":"el color de vaso","x":14,"y":71,"w":10,"h":22}]},{"src":"scenes/scene-invention-lab-v151-right-2.webp?v=1510","differences":[{"id":"invention-lab-brain-v2","key":"brain","label":"el color del cerebro de Coco","x":38,"y":43,"w":14,"h":18},{"id":"invention-lab-controls-v2","key":"controls","label":"el color de luces drobot","x":50,"y":73,"w":12,"h":12},{"id":"invention-lab-toolbox-v2","key":"toolbox","label":"el color de caja de herramientas","x":83,"y":73,"w":20,"h":22},{"id":"invention-lab-lamp-v2","key":"lamp","label":"el color de lámpara","x":31,"y":11,"w":16,"h":21},{"id":"invention-lab-beak-v2","key":"beak","label":"el color del pico de Coco","x":38,"y":57,"w":11,"h":14},{"id":"invention-lab-cup-v2","key":"cup","label":"el color de vaso","x":14,"y":71,"w":10,"h":22}]},{"src":"scenes/scene-invention-lab-v151-right-3.webp?v=1510","differences":[{"id":"invention-lab-brain-v3","key":"brain","label":"el color del cerebro de Coco","x":38,"y":43,"w":14,"h":18},{"id":"invention-lab-controls-v3","key":"controls","label":"el color de luces drobot","x":50,"y":73,"w":12,"h":12},{"id":"invention-lab-toolbox-v3","key":"toolbox","label":"el color de caja de herramientas","x":83,"y":73,"w":20,"h":22},{"id":"invention-lab-lamp-v3","key":"lamp","label":"el color de lámpara","x":31,"y":11,"w":16,"h":21},{"id":"invention-lab-beak-v3","key":"beak","label":"el color del pico de Coco","x":38,"y":57,"w":11,"h":14},{"id":"invention-lab-cup-v3","key":"cup","label":"el color de vaso","x":14,"y":71,"w":10,"h":22}]}]},{"id":"observatory","title":"El observatorio de Coco","left":"scenes/scene-observatory-v151-left.webp?v=1510","variants":[{"src":"scenes/scene-observatory-v151-right-1.webp?v=1510","differences":[{"id":"observatory-brain-v1","key":"brain","label":"el color del cerebro de Coco","x":45,"y":44,"w":14,"h":18},{"id":"observatory-lens-v1","key":"lens","label":"el color de lente dtelescopio","x":78,"y":29,"w":17,"h":20},{"id":"observatory-mug-v1","key":"mug","label":"el color de taza","x":10,"y":79,"w":11,"h":18},{"id":"observatory-chart-v1","key":"chart","label":"el color de mapa celeste","x":90,"y":36,"w":18,"h":27},{"id":"observatory-beak-v1","key":"beak","label":"el color del pico de Coco","x":45,"y":57,"w":11,"h":14},{"id":"observatory-toolbox-v1","key":"toolbox","label":"el color de caja de herramientas","x":89,"y":80,"w":19,"h":22}]},{"src":"scenes/scene-observatory-v151-right-2.webp?v=1510","differences":[{"id":"observatory-brain-v2","key":"brain","label":"el color del cerebro de Coco","x":45,"y":44,"w":14,"h":18},{"id":"observatory-lens-v2","key":"lens","label":"el color de lente dtelescopio","x":78,"y":29,"w":17,"h":20},{"id":"observatory-mug-v2","key":"mug","label":"el color de taza","x":10,"y":79,"w":11,"h":18},{"id":"observatory-chart-v2","key":"chart","label":"el color de mapa celeste","x":90,"y":36,"w":18,"h":27},{"id":"observatory-beak-v2","key":"beak","label":"el color del pico de Coco","x":45,"y":57,"w":11,"h":14},{"id":"observatory-toolbox-v2","key":"toolbox","label":"el color de caja de herramientas","x":89,"y":80,"w":19,"h":22}]},{"src":"scenes/scene-observatory-v151-right-3.webp?v=1510","differences":[{"id":"observatory-brain-v3","key":"brain","label":"el color del cerebro de Coco","x":45,"y":44,"w":14,"h":18},{"id":"observatory-lens-v3","key":"lens","label":"el color de lente dtelescopio","x":78,"y":29,"w":17,"h":20},{"id":"observatory-mug-v3","key":"mug","label":"el color de taza","x":10,"y":79,"w":11,"h":18},{"id":"observatory-chart-v3","key":"chart","label":"el color de mapa celeste","x":90,"y":36,"w":18,"h":27},{"id":"observatory-beak-v3","key":"beak","label":"el color del pico de Coco","x":45,"y":57,"w":11,"h":14},{"id":"observatory-toolbox-v3","key":"toolbox","label":"el color de caja de herramientas","x":89,"y":80,"w":19,"h":22}]}]},{"id":"tech-library","title":"La biblioteca tecnológica","left":"scenes/scene-tech-library-v151-left.webp?v=1510","variants":[{"src":"scenes/scene-tech-library-v151-right-1.webp?v=1510","differences":[{"id":"tech-library-brain-v1","key":"brain","label":"el color del cerebro de Coco","x":46,"y":34,"w":14,"h":18},{"id":"tech-library-toolbox-v1","key":"toolbox","label":"el color de caja de herramientas","x":89,"y":74,"w":19,"h":23},{"id":"tech-library-globe-v1","key":"globe","label":"el color de globo","x":93,"y":36,"w":11,"h":18},{"id":"tech-library-mug-v1","key":"mug","label":"el color de taza","x":30,"y":60,"w":10,"h":14},{"id":"tech-library-beak-v1","key":"beak","label":"el color del pico de Coco","x":46,"y":49,"w":11,"h":14},{"id":"tech-library-cans-v1","key":"cans","label":"el color de botes","x":29,"y":69,"w":11,"h":13}]},{"src":"scenes/scene-tech-library-v151-right-2.webp?v=1510","differences":[{"id":"tech-library-brain-v2","key":"brain","label":"el color del cerebro de Coco","x":46,"y":34,"w":14,"h":18},{"id":"tech-library-toolbox-v2","key":"toolbox","label":"el color de caja de herramientas","x":89,"y":74,"w":19,"h":23},{"id":"tech-library-globe-v2","key":"globe","label":"el color de globo","x":93,"y":36,"w":11,"h":18},{"id":"tech-library-mug-v2","key":"mug","label":"el color de taza","x":30,"y":60,"w":10,"h":14},{"id":"tech-library-beak-v2","key":"beak","label":"el color del pico de Coco","x":46,"y":49,"w":11,"h":14},{"id":"tech-library-cans-v2","key":"cans","label":"el color de botes","x":29,"y":69,"w":11,"h":13}]},{"src":"scenes/scene-tech-library-v151-right-3.webp?v=1510","differences":[{"id":"tech-library-brain-v3","key":"brain","label":"el color del cerebro de Coco","x":46,"y":34,"w":14,"h":18},{"id":"tech-library-toolbox-v3","key":"toolbox","label":"el color de caja de herramientas","x":89,"y":74,"w":19,"h":23},{"id":"tech-library-globe-v3","key":"globe","label":"el color de globo","x":93,"y":36,"w":11,"h":18},{"id":"tech-library-mug-v3","key":"mug","label":"el color de taza","x":30,"y":60,"w":10,"h":14},{"id":"tech-library-beak-v3","key":"beak","label":"el color del pico de Coco","x":46,"y":49,"w":11,"h":14},{"id":"tech-library-cans-v3","key":"cans","label":"el color de botes","x":29,"y":69,"w":11,"h":13}]}]},{"id":"electric-garage","title":"El garaje eléctrico","left":"scenes/scene-electric-garage-v151-left.webp?v=1510","variants":[{"src":"scenes/scene-electric-garage-v151-right-1.webp?v=1510","differences":[{"id":"electric-garage-brain-v1","key":"brain","label":"el color del cerebro de Coco","x":44,"y":39,"w":14,"h":18},{"id":"electric-garage-battery-v1","key":"battery","label":"el color de batería","x":56,"y":62,"w":14,"h":17},{"id":"electric-garage-toolbox-v1","key":"toolbox","label":"el color de caja de herramientas","x":11,"y":61,"w":21,"h":22},{"id":"electric-garage-floor-v1","key":"floor","label":"el color de señal dsuelo","x":53,"y":82,"w":12,"h":12},{"id":"electric-garage-beak-v1","key":"beak","label":"el color del pico de Coco","x":44,"y":52,"w":11,"h":14},{"id":"electric-garage-mug-v1","key":"mug","label":"el color de taza","x":94,"y":74,"w":10,"h":17}]},{"src":"scenes/scene-electric-garage-v151-right-2.webp?v=1510","differences":[{"id":"electric-garage-brain-v2","key":"brain","label":"el color del cerebro de Coco","x":44,"y":39,"w":14,"h":18},{"id":"electric-garage-battery-v2","key":"battery","label":"el color de batería","x":56,"y":62,"w":14,"h":17},{"id":"electric-garage-toolbox-v2","key":"toolbox","label":"el color de caja de herramientas","x":11,"y":61,"w":21,"h":22},{"id":"electric-garage-floor-v2","key":"floor","label":"el color de señal dsuelo","x":53,"y":82,"w":12,"h":12},{"id":"electric-garage-beak-v2","key":"beak","label":"el color del pico de Coco","x":44,"y":52,"w":11,"h":14},{"id":"electric-garage-mug-v2","key":"mug","label":"el color de taza","x":94,"y":74,"w":10,"h":17}]},{"src":"scenes/scene-electric-garage-v151-right-3.webp?v=1510","differences":[{"id":"electric-garage-brain-v3","key":"brain","label":"el color del cerebro de Coco","x":44,"y":39,"w":14,"h":18},{"id":"electric-garage-battery-v3","key":"battery","label":"el color de batería","x":56,"y":62,"w":14,"h":17},{"id":"electric-garage-toolbox-v3","key":"toolbox","label":"el color de caja de herramientas","x":11,"y":61,"w":21,"h":22},{"id":"electric-garage-floor-v3","key":"floor","label":"el color de señal dsuelo","x":53,"y":82,"w":12,"h":12},{"id":"electric-garage-beak-v3","key":"beak","label":"el color del pico de Coco","x":44,"y":52,"w":11,"h":14},{"id":"electric-garage-mug-v3","key":"mug","label":"el color de taza","x":94,"y":74,"w":10,"h":17}]}]},{"id":"robotics-studio","title":"El estudio de robótica","left":"scenes/scene-robotics-studio-v151-left.webp?v=1510","variants":[{"src":"scenes/scene-robotics-studio-v151-right-1.webp?v=1510","differences":[{"id":"robotics-studio-brain-v1","key":"brain","label":"el color del cerebro de Coco","x":56,"y":42,"w":14,"h":18},{"id":"robotics-studio-tools-v1","key":"tools","label":"el color de destornilladores","x":58,"y":86,"w":17,"h":15},{"id":"robotics-studio-mug-v1","key":"mug","label":"el color de taza","x":21,"y":80,"w":10,"h":17},{"id":"robotics-studio-lamp-v1","key":"lamp","label":"el color de lámpara","x":44,"y":11,"w":16,"h":21},{"id":"robotics-studio-beak-v1","key":"beak","label":"el color del pico de Coco","x":56,"y":54,"w":11,"h":14},{"id":"robotics-studio-toolbox-v1","key":"toolbox","label":"el color de caja de herramientas","x":85,"y":75,"w":19,"h":23}]},{"src":"scenes/scene-robotics-studio-v151-right-2.webp?v=1510","differences":[{"id":"robotics-studio-brain-v2","key":"brain","label":"el color del cerebro de Coco","x":56,"y":42,"w":14,"h":18},{"id":"robotics-studio-tools-v2","key":"tools","label":"el color de destornilladores","x":58,"y":86,"w":17,"h":15},{"id":"robotics-studio-mug-v2","key":"mug","label":"el color de taza","x":21,"y":80,"w":10,"h":17},{"id":"robotics-studio-lamp-v2","key":"lamp","label":"el color de lámpara","x":44,"y":11,"w":16,"h":21},{"id":"robotics-studio-beak-v2","key":"beak","label":"el color del pico de Coco","x":56,"y":54,"w":11,"h":14},{"id":"robotics-studio-toolbox-v2","key":"toolbox","label":"el color de caja de herramientas","x":85,"y":75,"w":19,"h":23}]},{"src":"scenes/scene-robotics-studio-v151-right-3.webp?v=1510","differences":[{"id":"robotics-studio-brain-v3","key":"brain","label":"el color del cerebro de Coco","x":56,"y":42,"w":14,"h":18},{"id":"robotics-studio-tools-v3","key":"tools","label":"el color de destornilladores","x":58,"y":86,"w":17,"h":15},{"id":"robotics-studio-mug-v3","key":"mug","label":"el color de taza","x":21,"y":80,"w":10,"h":17},{"id":"robotics-studio-lamp-v3","key":"lamp","label":"el color de lámpara","x":44,"y":11,"w":16,"h":21},{"id":"robotics-studio-beak-v3","key":"beak","label":"el color del pico de Coco","x":56,"y":54,"w":11,"h":14},{"id":"robotics-studio-toolbox-v3","key":"toolbox","label":"el color de caja de herramientas","x":85,"y":75,"w":19,"h":23}]}]},{"id":"ocean-lab","title":"El laboratorio submarino","left":"scenes/scene-ocean-lab-v151-left.webp?v=1510","variants":[{"src":"scenes/scene-ocean-lab-v151-right-1.webp?v=1510","differences":[{"id":"ocean-lab-brain-v1","key":"brain","label":"el color del cerebro de Coco","x":43,"y":40,"w":14,"h":18},{"id":"ocean-lab-mug-v1","key":"mug","label":"el color de taza","x":68,"y":69,"w":10,"h":15},{"id":"ocean-lab-canisters-v1","key":"canisters","label":"el color de depósitos","x":17,"y":65,"w":15,"h":16},{"id":"ocean-lab-floor-v1","key":"floor","label":"el color de aro dsuelo","x":85,"y":90,"w":12,"h":12},{"id":"ocean-lab-beak-v1","key":"beak","label":"el color del pico de Coco","x":43,"y":52,"w":11,"h":14},{"id":"ocean-lab-toolbox-v1","key":"toolbox","label":"el color de caja de herramientas","x":84,"y":73,"w":19,"h":23}]},{"src":"scenes/scene-ocean-lab-v151-right-2.webp?v=1510","differences":[{"id":"ocean-lab-brain-v2","key":"brain","label":"el color del cerebro de Coco","x":43,"y":40,"w":14,"h":18},{"id":"ocean-lab-mug-v2","key":"mug","label":"el color de taza","x":68,"y":69,"w":10,"h":15},{"id":"ocean-lab-canisters-v2","key":"canisters","label":"el color de depósitos","x":17,"y":65,"w":15,"h":16},{"id":"ocean-lab-floor-v2","key":"floor","label":"el color de aro dsuelo","x":85,"y":90,"w":12,"h":12},{"id":"ocean-lab-beak-v2","key":"beak","label":"el color del pico de Coco","x":43,"y":52,"w":11,"h":14},{"id":"ocean-lab-toolbox-v2","key":"toolbox","label":"el color de caja de herramientas","x":84,"y":73,"w":19,"h":23}]},{"src":"scenes/scene-ocean-lab-v151-right-3.webp?v=1510","differences":[{"id":"ocean-lab-brain-v3","key":"brain","label":"el color del cerebro de Coco","x":43,"y":40,"w":14,"h":18},{"id":"ocean-lab-mug-v3","key":"mug","label":"el color de taza","x":68,"y":69,"w":10,"h":15},{"id":"ocean-lab-canisters-v3","key":"canisters","label":"el color de depósitos","x":17,"y":65,"w":15,"h":16},{"id":"ocean-lab-floor-v3","key":"floor","label":"el color de aro dsuelo","x":85,"y":90,"w":12,"h":12},{"id":"ocean-lab-beak-v3","key":"beak","label":"el color del pico de Coco","x":43,"y":52,"w":11,"h":14},{"id":"ocean-lab-toolbox-v3","key":"toolbox","label":"el color de caja de herramientas","x":84,"y":73,"w":19,"h":23}]}]},{"id":"botanical-greenhouse","title":"El invernadero botánico","left":"scenes/scene-botanical-greenhouse-v151-left.webp?v=1510","variants":[{"src":"scenes/scene-botanical-greenhouse-v151-right-1.webp?v=1510","differences":[{"id":"botanical-greenhouse-brain-v1","key":"brain","label":"el color del cerebro de Coco","x":50,"y":33,"w":14,"h":18},{"id":"botanical-greenhouse-pot-v1","key":"pot","label":"el color de maceta","x":75,"y":7,"w":11,"h":13},{"id":"botanical-greenhouse-bottle-v1","key":"bottle","label":"el color de botella","x":24,"y":84,"w":10,"h":17},{"id":"botanical-greenhouse-notebook-v1","key":"notebook","label":"el color de cuaderno","x":42,"y":91,"w":16,"h":12},{"id":"botanical-greenhouse-beak-v1","key":"beak","label":"el color del pico de Coco","x":50,"y":47,"w":11,"h":14},{"id":"botanical-greenhouse-cutters-v1","key":"cutters","label":"el color de tijeras","x":71,"y":86,"w":16,"h":12}]},{"src":"scenes/scene-botanical-greenhouse-v151-right-2.webp?v=1510","differences":[{"id":"botanical-greenhouse-brain-v2","key":"brain","label":"el color del cerebro de Coco","x":50,"y":33,"w":14,"h":18},{"id":"botanical-greenhouse-pot-v2","key":"pot","label":"el color de maceta","x":75,"y":7,"w":11,"h":13},{"id":"botanical-greenhouse-bottle-v2","key":"bottle","label":"el color de botella","x":24,"y":84,"w":10,"h":17},{"id":"botanical-greenhouse-notebook-v2","key":"notebook","label":"el color de cuaderno","x":42,"y":91,"w":16,"h":12},{"id":"botanical-greenhouse-beak-v2","key":"beak","label":"el color del pico de Coco","x":50,"y":47,"w":11,"h":14},{"id":"botanical-greenhouse-cutters-v2","key":"cutters","label":"el color de tijeras","x":71,"y":86,"w":16,"h":12}]},{"src":"scenes/scene-botanical-greenhouse-v151-right-3.webp?v=1510","differences":[{"id":"botanical-greenhouse-brain-v3","key":"brain","label":"el color del cerebro de Coco","x":50,"y":33,"w":14,"h":18},{"id":"botanical-greenhouse-pot-v3","key":"pot","label":"el color de maceta","x":75,"y":7,"w":11,"h":13},{"id":"botanical-greenhouse-bottle-v3","key":"bottle","label":"el color de botella","x":24,"y":84,"w":10,"h":17},{"id":"botanical-greenhouse-notebook-v3","key":"notebook","label":"el color de cuaderno","x":42,"y":91,"w":16,"h":12},{"id":"botanical-greenhouse-beak-v3","key":"beak","label":"el color del pico de Coco","x":50,"y":47,"w":11,"h":14},{"id":"botanical-greenhouse-cutters-v3","key":"cutters","label":"el color de tijeras","x":71,"y":86,"w":16,"h":12}]}]},{"id":"music-studio","title":"El estudio musical","left":"scenes/scene-music-studio-v151-left.webp?v=1510","variants":[{"src":"scenes/scene-music-studio-v151-right-1.webp?v=1510","differences":[{"id":"music-studio-brain-v1","key":"brain","label":"el color del cerebro de Coco","x":52,"y":40,"w":14,"h":18},{"id":"music-studio-controls-v1","key":"controls","label":"el color de controles","x":25,"y":84,"w":21,"h":15},{"id":"music-studio-bells-v1","key":"bells","label":"el color de campanas","x":84,"y":22,"w":22,"h":13},{"id":"music-studio-records-v1","key":"records","label":"el color de discos","x":88,"y":76,"w":21,"h":18},{"id":"music-studio-beak-v1","key":"beak","label":"el color del pico de Coco","x":52,"y":53,"w":11,"h":14},{"id":"music-studio-metronome-v1","key":"metronome","label":"el color de metrónomo","x":65,"y":67,"w":11,"h":27}]},{"src":"scenes/scene-music-studio-v151-right-2.webp?v=1510","differences":[{"id":"music-studio-brain-v2","key":"brain","label":"el color del cerebro de Coco","x":52,"y":40,"w":14,"h":18},{"id":"music-studio-controls-v2","key":"controls","label":"el color de controles","x":25,"y":84,"w":21,"h":15},{"id":"music-studio-bells-v2","key":"bells","label":"el color de campanas","x":84,"y":22,"w":22,"h":13},{"id":"music-studio-records-v2","key":"records","label":"el color de discos","x":88,"y":76,"w":21,"h":18},{"id":"music-studio-beak-v2","key":"beak","label":"el color del pico de Coco","x":52,"y":53,"w":11,"h":14},{"id":"music-studio-metronome-v2","key":"metronome","label":"el color de metrónomo","x":65,"y":67,"w":11,"h":27}]},{"src":"scenes/scene-music-studio-v151-right-3.webp?v=1510","differences":[{"id":"music-studio-brain-v3","key":"brain","label":"el color del cerebro de Coco","x":52,"y":40,"w":14,"h":18},{"id":"music-studio-controls-v3","key":"controls","label":"el color de controles","x":25,"y":84,"w":21,"h":15},{"id":"music-studio-bells-v3","key":"bells","label":"el color de campanas","x":84,"y":22,"w":22,"h":13},{"id":"music-studio-records-v3","key":"records","label":"el color de discos","x":88,"y":76,"w":21,"h":18},{"id":"music-studio-beak-v3","key":"beak","label":"el color del pico de Coco","x":52,"y":53,"w":11,"h":14},{"id":"music-studio-metronome-v3","key":"metronome","label":"el color de metrónomo","x":65,"y":67,"w":11,"h":27}]}]},{"id":"space-station","title":"La estación espacial","left":"scenes/scene-space-station-v151-left.webp?v=1510","variants":[{"src":"scenes/scene-space-station-v151-right-1.webp?v=1510","differences":[{"id":"space-station-brain-v1","key":"brain","label":"el color del cerebro de Coco","x":47,"y":44,"w":14,"h":18},{"id":"space-station-plant-v1","key":"plant","label":"el color de planta","x":86,"y":40,"w":15,"h":24},{"id":"space-station-robot-v1","key":"robot","label":"el color de robot","x":62,"y":66,"w":16,"h":29},{"id":"space-station-tools-v1","key":"tools","label":"el color de herramientas","x":35,"y":88,"w":19,"h":12},{"id":"space-station-beak-v1","key":"beak","label":"el color del pico de Coco","x":47,"y":57,"w":11,"h":14},{"id":"space-station-case-v1","key":"case","label":"el color de caja","x":89,"y":65,"w":17,"h":20}]},{"src":"scenes/scene-space-station-v151-right-2.webp?v=1510","differences":[{"id":"space-station-brain-v2","key":"brain","label":"el color del cerebro de Coco","x":47,"y":44,"w":14,"h":18},{"id":"space-station-plant-v2","key":"plant","label":"el color de planta","x":86,"y":40,"w":15,"h":24},{"id":"space-station-robot-v2","key":"robot","label":"el color de robot","x":62,"y":66,"w":16,"h":29},{"id":"space-station-tools-v2","key":"tools","label":"el color de herramientas","x":35,"y":88,"w":19,"h":12},{"id":"space-station-beak-v2","key":"beak","label":"el color del pico de Coco","x":47,"y":57,"w":11,"h":14},{"id":"space-station-case-v2","key":"case","label":"el color de caja","x":89,"y":65,"w":17,"h":20}]},{"src":"scenes/scene-space-station-v151-right-3.webp?v=1510","differences":[{"id":"space-station-brain-v3","key":"brain","label":"el color del cerebro de Coco","x":47,"y":44,"w":14,"h":18},{"id":"space-station-plant-v3","key":"plant","label":"el color de planta","x":86,"y":40,"w":15,"h":24},{"id":"space-station-robot-v3","key":"robot","label":"el color de robot","x":62,"y":66,"w":16,"h":29},{"id":"space-station-tools-v3","key":"tools","label":"el color de herramientas","x":35,"y":88,"w":19,"h":12},{"id":"space-station-beak-v3","key":"beak","label":"el color del pico de Coco","x":47,"y":57,"w":11,"h":14},{"id":"space-station-case-v3","key":"case","label":"el color de caja","x":89,"y":65,"w":17,"h":20}]}]}];
  var levelSelected = 1;
  var user = null;
  var game = null;
  var timer = 0;
  var controller = null;

  function selectorValue(value) { return String(value || "").replace(/([\\"'\\[\\]#.:])/g, "\\$1"); }
  function hash(text) { var value = 0; String(text).split("").forEach(function (character) { value = (Math.imul(value, 31) + character.charCodeAt(0)) | 0; }); return value; }
  function config(level) { return level === 1 ? { count: 4, seconds: 150 } : level === 2 ? { count: 5, seconds: 130 } : { count: 6, seconds: 110 }; }

  function todayChoice() {
    var forced = null, forcedVariant = null;
    try {
      if (/localhost|127\.0\.0\.1|terminal\.local/i.test(location.hostname || "")) {
        var params = new URLSearchParams(location.search);
        forced = params.get("qaScene");
        forcedVariant = params.get("qaVariant");
      }
    } catch (_) {}
    var userKey = user && user.id || "visitante";
    var serial = Math.floor(Date.parse(C.today() + "T12:00:00Z") / 86400000);
    var value = serial + hash(userKey) + levelSelected * 17;
    var scene = forced && SCENES.find(function (item) { return item.id === forced; }) || SCENES[((value % SCENES.length) + SCENES.length) % SCENES.length];
    var variantIndex = forcedVariant == null ? Math.abs(Math.floor(value / SCENES.length)) % scene.variants.length : Math.max(0, Math.min(scene.variants.length - 1, Number(forcedVariant) || 0));
    return { scene: scene, variant: scene.variants[variantIndex], variantIndex: variantIndex, id: scene.id + "-v" + (variantIndex + 1) };
  }

  function materialize(choice, count) {
    return choice.variant.differences.slice(0, count).map(function (item) {
      return {
        id: item.id, key: item.key, label: item.label,
        x: Number(item.x), y: Number(item.y),
        w: Math.max(11, Number(item.w) || 11),
        h: Math.max(14, Number(item.h) || 14)
      };
    });
  }

  async function resolveUser() {
    var session = await C.session();
    if (!session || !session.user) return { id: "visitante", name: "Jugador Coco" };
    if (root.CocoDailyV134 && typeof root.CocoDailyV134.setUser === "function") root.CocoDailyV134.setUser(session.user.id, session.user.email || "");
    var metadata = session.user.user_metadata || {};
    return { id: session.user.id, name: metadata.apodo || metadata.username || (session.user.email || "Jugador Coco").split("@")[0] };
  }
  function userId() { return user && user.id || "visitante"; }
  function unlimitedTesting() { return Boolean(root.CocoDailyV134 && typeof root.CocoDailyV134.isUnlimited === "function" && root.CocoDailyV134.isUnlimited(userId())); }
  async function canPlay() {
    if (!root.CocoDailyV134 || typeof root.CocoDailyV134.canPlay !== "function") return true;
    try { return await root.CocoDailyV134.canPlay("diferencias", userId()); } catch (_) { return true; }
  }

  function introHtml(allowed) {
    var choice = todayChoice(), cfg = config(levelSelected), unlimited = unlimitedTesting();
    return '<main class="c144DiffIntro c151DiffIntro"><section class="c144Card"><span class="c144Eyebrow">ATENCIÓN VISUAL · ESCENAS PRECOMPUESTAS</span><h3>Encuentra las diferencias</h3><p>Compara dos ilustraciones completas de la misma escena. Los cambios pertenecen a objetos reales de la imagen: no se dibujan palitos, manchas, círculos ni parches encima durante la partida.</p><div class="c151DiffPrinciples"><span>Objetos reales</span><span>Mayor luminosidad</span><span>Sin pistas previas</span></div><div class="c144LevelButtons"><button type="button" data-diff151-level="1" class="' + (levelSelected === 1 ? "active" : "") + '">Básico · 4</button><button type="button" data-diff151-level="2" class="' + (levelSelected === 2 ? "active" : "") + '">Intermedio · 5</button><button type="button" data-diff151-level="3" class="' + (levelSelected === 3 ? "active" : "") + '">Avanzado · 6</button></div><p class="c144Notice">Escenario de hoy: <b>' + C.esc(choice.scene.title) + '</b> · combinación ' + (choice.variantIndex + 1) + '/3 · ' + cfg.seconds + ' segundos.</p>' + (unlimited ? '<p class="c144Notice">Modo de pruebas activo: puedes repetir sin límite. Solo el primer resultado válido del día puntúa.</p>' : '') + '<div class="c144Actions"><button type="button" class="c144Primary" data-diff151-start ' + (allowed ? "" : "disabled") + '>' + (allowed ? (unlimited ? "Comenzar partida de prueba" : "Comenzar") : "Completado hoy") + '</button></div></section></main>';
  }

  async function renderIntro() {
    var allowed = await canPlay(), body = C.body();
    if (!body) return;
    C.setModalTitle("Encuentra las diferencias", "ATENCIÓN VISUAL · v151.0");
    body.innerHTML = introHtml(allowed);
    body.querySelectorAll("[data-diff151-level]").forEach(function (button) {
      button.onclick = function () { levelSelected = Number(button.dataset.diff151Level) || 1; renderIntro(); };
    });
    var start = body.querySelector("[data-diff151-start]");
    if (start && !start.disabled) start.onclick = startGame;
  }

  function sceneMarkup(side) {
    var src = side === "left" ? game.scene.left : game.variant.src;
    return '<div class="c144DiffScene c151DiffScene" data-diff151-scene="' + side + '" data-ready="false" role="img" aria-label="Escena ' + (side === "left" ? "original" : "modificada") + '. Busca las diferencias sin pistas visuales."><img class="c151DiffImage" data-diff151-image="' + side + '" src="' + C.esc(src) + '" alt="" draggable="false">' + game.items.map(function (item) { return '<button type="button" tabindex="-1" aria-hidden="true" class="c144DiffHit c151DiffHit" data-diff151-id="' + item.id + '" style="left:' + item.x + '%;top:' + item.y + '%;width:' + item.w + '%;height:' + item.h + '%"></button>'; }).join("") + '</div>';
  }

  function gameHtml() {
    return '<main class="c144Diff c151Diff"><div class="c144DiffTop"><div><span class="c144Eyebrow">ESCENARIO: ' + C.esc(game.scene.title).toUpperCase() + '</span><h3>Encuentra ' + game.items.length + ' diferencias</h3><p>Pulsa cada cambio en cualquiera de las dos escenas. Las dos imágenes son archivos completos, ya compuestos e iluminados antes de jugar.</p></div><div class="c144DiffCounters"><div><b data-diff151-found>0/' + game.items.length + '</b><span>ENCONTRADAS</span></div><div><b data-diff151-time>' + game.remaining + ' s</b><span>TIEMPO</span></div><div><b data-diff151-misses>0</b><span>FALLOS</span></div></div></div><div class="c144DiffBoards"><section class="c144DiffPanel c151DiffPanel"><header><span>1 · Original</span><small>Iluminación optimizada</small></header>' + sceneMarkup("left") + '</section><section class="c144DiffPanel c151DiffPanel"><header><span>2 · Modificada</span><small>Cambios integrados</small></header>' + sceneMarkup("right") + '</section></div></main>';
  }

  function pointInside(scene, event, item) {
    var rect = scene.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    var x = (event.clientX - rect.left) / rect.width * 100, y = (event.clientY - rect.top) / rect.height * 100;
    var nx = (x - item.x) / (item.w / 2), ny = (y - item.y) / (item.h / 2);
    return nx * nx + ny * ny <= 1;
  }

  function itemAt(scene, event) {
    var rect = scene.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    var x = (event.clientX - rect.left) / rect.width * 100, y = (event.clientY - rect.top) / rect.height * 100;
    var matches = game.items.filter(function (item) { return !game.found.has(item.id) && pointInside(scene, event, item); });
    matches.sort(function (a, b) {
      var ax = (x - a.x) / (a.w / 2), ay = (y - a.y) / (a.h / 2), bx = (x - b.x) / (b.w / 2), by = (y - b.y) / (b.h / 2);
      return ax * ax + ay * ay - (bx * bx + by * by);
    });
    return matches[0] || null;
  }

  function answer(item, scene, event) {
    if (!game || game.finished || scene.dataset.ready !== "true") return;
    if (item && game.found.has(item.id)) return;
    if (item) {
      game.found.add(item.id);
      C.body().querySelectorAll('[data-diff151-id="' + selectorValue(item.id) + '"]').forEach(function (button) {
        button.classList.add("found");
        button.innerHTML = '<span aria-hidden="true">✓</span>';
      });
      C.sound("good");
      updateHud();
      if (game.found.size >= game.items.length) finish("complete");
      return;
    }
    game.misses++;
    var rect = scene.getBoundingClientRect(), marker = document.createElement("span");
    marker.className = "c144DiffMiss";
    marker.textContent = "×";
    marker.style.left = Math.max(2, Math.min(98, (event.clientX - rect.left) / rect.width * 100)) + "%";
    marker.style.top = Math.max(2, Math.min(98, (event.clientY - rect.top) / rect.height * 100)) + "%";
    scene.appendChild(marker);
    setTimeout(function () { marker.remove(); }, 620);
    C.sound("bad");
    updateHud();
  }

  function loadScenes() {
    var images = Array.prototype.slice.call(C.body().querySelectorAll("[data-diff151-image]")), loaded = 0, failed = false;
    if (!images.length) return;
    function ready(image) {
      var scene = image.closest("[data-diff151-scene]");
      if (scene) scene.dataset.ready = "true";
      loaded++;
      if (!failed && loaded === images.length && game && !game.finished) {
        game.startedAt = Date.now();
        timer = setInterval(tick, 250);
        updateHud();
      }
    }
    images.forEach(function (image) {
      if (image.complete && image.naturalWidth) ready(image);
      else {
        image.onload = function () { ready(image); };
        image.onerror = function () {
          failed = true;
          var body = C.body();
          if (!body) return;
          body.innerHTML = '<div class="c144Empty"><b>No se pudo cargar el escenario</b><span>Comprueba que el ZIP incluya las escenas v151.</span><button type="button" class="c144Secondary" data-diff151-retry>Reintentar</button></div>';
          var retry = body.querySelector("[data-diff151-retry]"); if (retry) retry.onclick = startGame;
        };
      }
    });
  }

  function tick() {
    if (!game || game.finished) return;
    game.remaining = Math.max(0, game.limit - (Date.now() - game.startedAt) / 1000);
    updateHud();
    if (game.remaining <= 0) finish("time");
  }

  function score() {
    var accuracy = game.found.size / game.items.length, precision = game.items.length / (game.items.length + game.misses), speed = Math.max(0, game.remaining / game.limit);
    return Math.round(Math.max(0, Math.min(320, 230 * accuracy + 50 * accuracy * precision + (accuracy === 1 ? 40 * speed : 0))));
  }

  function updateHud() {
    var body = C.body(); if (!body || !game) return;
    var found = body.querySelector("[data-diff151-found]"), time = body.querySelector("[data-diff151-time]"), misses = body.querySelector("[data-diff151-misses]");
    if (found) found.textContent = game.found.size + "/" + game.items.length;
    if (time) time.textContent = Math.ceil(game.remaining) + " s";
    if (misses) misses.textContent = game.misses;
  }

  async function saveScore(points) {
    var result = null, arcade = root.CocoArcadeV133;
    if (arcade && typeof arcade.saveScore === "function") result = await arcade.saveScore("diferencias", points, { found: game && game.found.size || 0, total: game && game.items.length || 0, misses: game && game.misses || 0, level: levelSelected }, userId());
    else if (userId() !== "visitante") {
      var api = C.client();
      try {
        result = await api.rpc("registrar_partida_coco", { p_juego: "diferencias", p_puntos: points });
        if (result.error && /could not find|schema cache|PGRST202/i.test(result.error.message || result.error.code || "")) result = await api.from("partidas").insert({ jugador: userId(), juego: "diferencias", puntos: points });
        result = result && result.error ? { ok: false, error: result.error.message || "No se pudo guardar." } : { ok: true };
      } catch (error) { result = { ok: false, error: error && error.message || "No se pudo guardar." }; }
    }
    if (result && result.ok && root.CocoDailyV134 && typeof root.CocoDailyV134.complete === "function") await root.CocoDailyV134.complete("diferencias", userId());
    return result || { ok: userId() === "visitante", local: true };
  }

  async function finish(reason) {
    if (!game || game.finished) return;
    game.finished = true; clearInterval(timer);
    var points = score(), saved = await saveScore(points);
    C.sound(reason === "complete" ? "finish" : "bad");
    var body = C.body(); if (!body) return;
    var saveCopy = saved && saved.test ? "Partida de prueba completada sin duplicar puntos. Solo el primer resultado válido del día puntúa." : saved && saved.ok ? "Puntuación guardada correctamente." : "No se pudo guardar la puntuación todavía.";
    C.setModalTitle("Encuentra las diferencias", "RESULTADO · CLASIFICACIÓN GENERAL");
    body.innerHTML = '<main class="c144DiffResult"><section class="c144Card"><span class="c144Eyebrow">' + (reason === "complete" ? "ESCENARIO COMPLETADO" : "TIEMPO FINALIZADO") + '</span><h3>' + game.found.size + ' de ' + game.items.length + ' diferencias</h3><div class="c144RunnerMetrics"><div><b>' + points + '</b><span>' + (saved && saved.test ? 'Resultado de prueba' : 'Puntos') + '</span></div><div><b>' + game.misses + '</b><span>Clics falsos</span></div><div><b>' + Math.ceil(game.limit - game.remaining) + ' s</b><span>Tiempo</span></div></div><p class="c144Notice">' + C.esc(saveCopy) + '</p><p class="c144HealthyEnd">Buen entrenamiento visual. Descansa la vista mirando a lo lejos durante unos instantes.</p><div class="c144Actions" style="justify-content:center"><button type="button" class="c144Primary" data-diff151-close>Volver</button></div></section></main>';
    body.querySelector("[data-diff151-close]").onclick = C.closeModal;
  }

  async function startGame() {
    if (!(await canPlay())) { renderIntro(); return; }
    var cfg = config(levelSelected), choice = todayChoice();
    game = {
      scene: choice.scene, variant: choice.variant, combinationId: choice.id, variantIndex: choice.variantIndex,
      items: materialize(choice, cfg.count), found: new Set(), misses: 0, limit: cfg.seconds,
      remaining: cfg.seconds, startedAt: 0, finished: false
    };
    var body = C.body(); if (!body) return;
    body.innerHTML = gameHtml();
    controller = new AbortController();
    body.querySelectorAll("[data-diff151-scene]").forEach(function (sceneNode) {
      sceneNode.addEventListener("click", function (event) {
        var hotspot = event.target.closest("[data-diff151-id]");
        var hotspotItem = hotspot ? game.items.find(function (item) { return item.id === hotspot.dataset.diff151Id; }) : null;
        var exact = hotspotItem && (event.detail === 0 || pointInside(sceneNode, event, hotspotItem)) ? hotspotItem : null;
        answer(exact || itemAt(sceneNode, event), sceneNode, event);
      }, { signal: controller.signal });
    });
    loadScenes();
  }

  async function open() {
    C.openModal({ module: "differences", title: "Encuentra las diferencias", kicker: "ATENCIÓN VISUAL · v151.0", html: '<div class="c144Empty"><b>Coco está preparando el escenario…</b></div>', dispose: dispose });
    user = await resolveUser();
    renderIntro();
  }

  function dispose() {
    clearInterval(timer);
    if (controller) controller.abort();
    controller = null;
    if (game) game.finished = true;
    game = null;
  }

  var api = {
    version: "151.0.0",
    open: open,
    scenes: SCENES,
    config: config,
    materializeForAudit: function (sceneId, variant, count) {
      var scene = SCENES.find(function (item) { return item.id === sceneId; });
      if (!scene) throw new Error("Escenario no encontrado: " + sceneId);
      var variantIndex = Math.max(0, Math.min(scene.variants.length - 1, Number(variant) || 0));
      return materialize({ scene: scene, variant: scene.variants[variantIndex], variantIndex: variantIndex }, Math.max(1, Math.min(6, Number(count) || 6)));
    },
    audit: function () {
      return {
        sceneCount: SCENES.length,
        variantsPerScene: 3,
        combinationsPerLevel: SCENES.length * 3,
        levels: { basic: 4, intermediate: 5, advanced: 6 },
        everySceneHasSix: SCENES.every(function (scene) { return scene.variants.length === 3 && scene.variants.every(function (variant) { return variant.differences.length === 6; }); }),
        precomposedPairs: true,
        runtimeSyntheticOverlays: false,
        runtimeCanvasPatches: false,
        genericCircleMarkersBeforeAnswer: false,
        clickableFromBothImages: true,
        normalizedCoordinates: true,
        falseClicksAccepted: false,
        brightness: "preprocessed-local-contrast",
        localAssetsOnly: true,
        renderer: "paired-precomposed-scenes-v151"
      };
    }
  };
  root.CocoDifferencesProV151 = api;
  root.CocoDifferencesProV150 = api;
  root.CocoDifferencesProV149 = api;
  root.CocoDifferencesProV148 = api;
  root.CocoDifferencesProV147 = api;
  root.CocoDifferencesProV146 = api;
  root.CocoDifferencesProV144 = api;
})(window);
