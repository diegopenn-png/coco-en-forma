/* Coco en Forma · Variety Director v160.96.0
 * Refuerza la rotación equilibrada de contenidos y familias mecánicas.
 * No modifica autenticación, pagos, límites diarios, puntuaciones ni partidas.
 */
(function installCocoVarietyDirector(root){
  "use strict";

  var VERSION="160.96.0-balanced-variety";
  var ACTIVE_GAMES=Object.freeze(["numeros","calculo","palabras","series","memoria","sudoku","sopa","crucigrama","tiempo","verdadero","futbol","cocomed","padel"]);
  var lastGeneratedFamily=Object.create(null);
  var installAttempts=0;

  function normalize(value){
    return String(value==null?"":value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()
  }

  function stableValue(value){
    if(value==null)return"";
    if(Array.isArray(value))return value.map(stableValue).join(" ");
    if(typeof value==="object")return Object.keys(value).sort().map(function(key){return key+" "+stableValue(value[key])}).join(" ");
    return String(value)
  }

  function parseLegacyKey(key){
    var parts=String(key||"general").split("_");
    if(parts[0]==="tema"&&parts.length>=3)return{game:parts[1],mode:"tema",level:parts[parts.length-1]};
    return{game:parts[0]||"general",mode:parts.slice(1,-1).join("_")||"classic",level:parts.length>1?parts[parts.length-1]:"all"}
  }

  function lexicalDomain(value){
    var text=normalize(stableValue(value));
    if(/\b(numero|suma|resta|multiplica|division|fraccion|ecuacion|angulo|geometr|perimetro|porcentaje|media|probabilidad|decimal|algebra)\b/.test(text))return"matematicas";
    if(/\b(palabra|letra|verbo|sustantivo|adjetivo|oracion|ortografia|lengua|literatura|metafora|sinonimo|antonimo|narrador|vocabulario)\b/.test(text))return"lengua";
    if(/\b(celula|animal|planta|cuerpo|cerebro|salud|medic|virus|bacteria|ecosistema|energia|gravedad|planeta|espacio|quimic|fisic|biolog|naturaleza)\b/.test(text))return"ciencia";
    if(/\b(historia|edad media|romano|guerra|siglo|reino|democracia|constitucion|geografia|pais|capital|rio|montana|continente)\b/.test(text))return"sociales";
    if(/\b(deporte|futbol|padel|tenis|balon|atletismo|equipo|carrera|salto)\b/.test(text))return"deporte";
    if(/\b(tecnologia|robot|programacion|internet|ordenador|computadora|circuito|digital)\b/.test(text))return"tecnologia";
    if(/\b(emocion|convivencia|respeto|amistad|solidaridad|responsabilidad|seguridad|habito)\b/.test(text))return"bienestar";
    return"general"
  }

  function objectMechanic(item){
    if(!item||typeof item!=="object"||Array.isArray(item))return"";
    var value=item.type||item.tipo||item.tag||item.kind||item.mechanic||item.operation||item.op||item.category||item.categoria||item.stage||item.etapa||"";
    return normalize(value).slice(0,64)
  }

  function inferCategory(game,item){
    game=normalize(game);
    if(game==="cocomed")return objectMechanic(item)||normalize(item&&item.subject)||"salud";
    if(game==="memoria")return normalize(item&&item.nombre||item&&item.theme||item&&item.id)||lexicalDomain(item);
    if(game==="sopa")return normalize(item&&item.nombre||item&&item.theme)||lexicalDomain(item);
    if(game==="verdadero"&&Array.isArray(item))return lexicalDomain(item[0]);
    if((game==="palabras"||game==="crucigrama")&&Array.isArray(item))return lexicalDomain(String(item[0]||"")+" "+String(item[1]||""));
    return objectMechanic(item)||lexicalDomain(item)
  }

  function inferAnswer(game,item){
    if(game==="verdadero"&&Array.isArray(item))return item[1]===true?"verdadero":item[1]===false?"falso":"";
    if(item&&typeof item==="object"&&!Array.isArray(item)){
      var value=item.answer;
      if(value==null)value=item.respuesta;
      if(value==null)value=item.correct;
      if(value==null)value=item.correcta;
      if(value==null)value=item.solution;
      if(value!=null)return normalize(value).slice(0,80)
    }
    return""
  }

  function edgeFamily(index,size){
    if(!Number.isFinite(index)||!size)return"interior";
    var row=Math.floor(index/size),column=index%size;
    if(row===0)return"norte";
    if(row===size-1)return"sur";
    if(column===0)return"oeste";
    if(column===size-1)return"este";
    return"interior"
  }

  function pathFamily(path){
    var size=Math.round(Math.sqrt(path.length));
    if(size*size!==path.length||path.length<2)return"ruta";
    var turns=0,lastDirection="";
    for(var index=1;index<path.length;index++){
      var delta=Number(path[index])-Number(path[index-1]),direction=Math.abs(delta)===1?"horizontal":"vertical";
      if(lastDirection&&lastDirection!==direction)turns++;
      lastDirection=direction
    }
    var density=turns<Math.max(3,size)?"fluida":turns<Math.max(6,size*2)?"mixta":"zigzag";
    return"entrada-"+edgeFamily(Number(path[0]),size)+"|salida-"+edgeFamily(Number(path[path.length-1]),size)+"|"+density
  }

  function calculationFamily(text){
    var value=normalize(text);
    if(/%|por ciento|porcentaje/.test(String(text)))return"porcentaje";
    if(/\^|cuadrado|cubo|potencia/.test(value))return"potencias";
    if(/media|promedio/.test(value))return"media";
    if(/\//.test(String(text)))return"fracciones";
    if(/\bx\b|incognita|ecuacion/.test(value))return"ecuacion";
    if(/perimetro|area/.test(value))return"geometria";
    var operators=String(text||"").match(/[+−–\-*×÷:]/g)||[];
    if(operators.length>1)return"encadenada";
    if(/[÷:]/.test(String(text)))return"division";
    if(/[×*]/.test(String(text)))return"producto";
    if(/[−–-]/.test(String(text)))return"resta";
    if(/\+/.test(String(text)))return"suma";
    return"calculo"
  }

  function generatedFamily(key,value){
    var game=parseLegacyKey(key).game,mechanic=objectMechanic(value);
    if(game==="numeros"&&Array.isArray(value))return pathFamily(value);
    if(game==="calculo")return calculationFamily(value&&value.texto!=null?value.texto:value);
    if(game==="series")return mechanic||lexicalDomain(value);
    if(game==="tiempo")return normalize(value&&value.tag)||mechanic||"microreto";
    if(game==="futbol")return"tempo-"+String(value&&value.tempo!=null?value.tempo:"mixto");
    return mechanic||lexicalDomain(value)
  }

  function joinCategory(primary,secondary){
    primary=normalize(primary)||"general";secondary=normalize(secondary)||"general";
    if(primary==="general"&&secondary!=="general")return secondary;
    return secondary==="general"||secondary===primary?primary:primary+"|"+secondary
  }

  function install(){
    var rotation=root.CocoRotationV134;
    if(!rotation||typeof rotation.choose!=="function"||typeof rotation.generateLegacy!=="function"){
      if(installAttempts++<40)setTimeout(install,50);
      return
    }
    if(rotation.__varietyDirectorV160960)return;

    var originalChoose=rotation.choose;
    var originalGenerateLegacy=rotation.generateLegacy;

    function choose(config){
      config=config&&typeof config==="object"?config:{};
      var next=Object.assign({},config),game=String(next.game||"general"),providedCategory=typeof config.getCategory==="function"?config.getCategory:null;
      next.getCategory=function(item,index){
        var inferred=inferCategory(game,item),provided=providedCategory?providedCategory(item,index):"";
        return joinCategory(provided,inferred)
      };
      if(typeof next.getAnswer!=="function")next.getAnswer=function(item){return inferAnswer(game,item)};
      return originalChoose.call(rotation,next)
    }

    function chooseLegacy(userId,key,items,count,getter){
      var parsed=parseLegacyKey(key);
      return choose({userId:userId,game:parsed.game,mode:parsed.mode,level:parsed.level,items:items,count:count,getId:getter})
    }

    function generateLegacy(userId,key,factory,attempts,getter){
      if(typeof factory!=="function")return originalGenerateLegacy.call(rotation,userId,key,factory,attempts,getter);
      var scope=String(userId||"visitante")+"|"+String(key||"general"),previous=lastGeneratedFamily[scope]||"";
      function variedFactory(){
        var candidate=factory(),family=generatedFamily(key,candidate),tries=1;
        while(previous&&family===previous&&tries++<8){candidate=factory();family=generatedFamily(key,candidate)}
        return candidate
      }
      var result=originalGenerateLegacy.call(rotation,userId,key,variedFactory,attempts,getter);
      lastGeneratedFamily[scope]=generatedFamily(key,result);
      return result
    }

    rotation.choose=choose;
    rotation.chooseLegacy=chooseLegacy;
    rotation.generateLegacy=generateLegacy;
    rotation.__varietyDirectorV160960=true;

    root.CocoVarietyDirectorV160960=Object.freeze({
      version:VERSION,
      activeGames:ACTIVE_GAMES,
      classify:function(game,item){return{category:inferCategory(game,item),answer:inferAnswer(game,item)}},
      generatedFamily:generatedFamily,
      audit:function(){return{version:VERSION,activeGames:ACTIVE_GAMES.length,rotationWrapped:rotation.choose===choose&&rotation.chooseLegacy===chooseLegacy&&rotation.generateLegacy===generateLegacy,balancedCategories:true,balancedAnswers:true,generatedMechanicGuard:true,exactSignatureGuardPreserved:true,sessionOnlyMechanicMemory:true,noAuthMutation:true,noPaymentMutation:true,noDailyLimitMutation:true,noScoreMutation:true}}
    })
  }

  install()
})(window);
