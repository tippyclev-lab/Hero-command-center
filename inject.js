// H.E.R.O. Scorecard Button Injector v2
(function(){
  var injected = false;
  
  function getReactState(){
    // Walk React fiber to find CultureIndexTab state
    var root = document.getElementById('root');
    if(!root) return null;
    var fiber = root._reactRootContainer;
    if(!fiber) fiber = root.__reactFiber$;
    if(!fiber){
      // Try finding via key
      var keys = Object.keys(root);
      for(var k of keys){
        if(k.startsWith('__react')){
          fiber = root[k];
          break;
        }
      }
    }
    return fiber;
  }

  function findResultData(){
    // Find result data by looking at the DOM text content
    var verdictEl = document.querySelector('[style*="PASS"], [style*="FAIL"]');
    var nameInput = document.querySelector('input[value]');
    return {
      name: nameInput ? nameInput.value : "Assessment",
      verdict: verdictEl ? verdictEl.textContent.trim() : "PASS"
    };
  }

  function injectButton(){
    // Don't inject twice
    if(document.getElementById('hero-scorecard-btn')) return;
    
    // Find the registry profile or hiring record link - signals results are shown
    var allSpans = document.querySelectorAll('span');
    var targetSpan = null;
    for(var i=0; i<allSpans.length; i++){
      var t = allSpans[i].textContent || '';
      if(t.indexOf('Registry profile') >= 0 || t.indexOf('hiring record') >= 0){
        targetSpan = allSpans[i];
        break;
      }
    }
    
    if(!targetSpan) return;
    
    // Find the parent card div
    var card = targetSpan.parentElement;
    while(card && !card.style.padding && !card.className.includes('card')){
      card = card.parentElement;
    }
    if(!card) card = targetSpan.parentElement;
    
    // Find the results container - go up to find siblings
    var resultsDiv = card.parentElement;
    if(!resultsDiv) return;
    
    // Create button
    var btn = document.createElement('button');
    btn.id = 'hero-scorecard-btn';
    btn.innerHTML = '🖨️ Print Talent Assessment Scorecard';
    btn.style.cssText = [
      'width:100%',
      'margin-top:10px',
      'padding:14px 20px',
      'font-size:14px',
      'font-weight:900',
      'cursor:pointer',
      'border-radius:6px',
      'border:2px solid #B8964A',
      'background:linear-gradient(135deg,#1B2A4A,#0d2a3a)',
      'color:#D4AF6A',
      'letter-spacing:1px',
      'display:block',
      'font-family:inherit',
      'min-height:48px'
    ].join(';');

    btn.addEventListener('click', function(){
      // Collect all visible text from results section
      var resultsText = [];
      var cards = document.querySelectorAll('[style*="border"][style*="border-radius"]');
      cards.forEach(function(c){
        var txt = c.textContent.trim();
        if(txt.length > 20 && txt.length < 2000) resultsText.push(txt);
      });
      
      // Get name from input
      var nameInput = document.querySelector('input[placeholder*="name"], input[value]');
      var name = nameInput ? nameInput.value : "Assessment";
      
      // Get verdict
      var passEl = Array.from(document.querySelectorAll('*')).find(function(el){
        var t = (el.textContent || '').trim();
        return (t === 'PASS' || t === 'FAIL') && el.children.length === 0;
      });
      var verdict = passEl ? passEl.textContent.trim() : "PASS";
      
      // Get confidence
      var confEl = Array.from(document.querySelectorAll('*')).find(function(el){
        var t = (el.textContent || '').trim();
        return (t === 'High' || t === 'Medium' || t === 'Low') && el.children.length === 0 && el.previousSibling;
      });
      var confidence = confEl ? confEl.textContent.trim() : "Medium";

      // Get strengths and watch areas from visible text
      var strengths = [];
      var watchAreas = [];
      var allItems = document.querySelectorAll('[style*="10px"][style*="D4AF6A"], [style*="10px"][style*="d0c090"]');
      allItems.forEach(function(el){
        var t = el.textContent.trim();
        if(t.length > 10 && t.length < 300){
          var parent = el.parentElement;
          if(parent && parent.innerHTML.indexOf('60c060') >= 0) strengths.push(t);
          else watchAreas.push(t);
        }
      });

      // Get recommendation
      var recEl = document.querySelector('[style*="e8c060"][style*="italic"]');
      var rec = recEl ? recEl.textContent.replace(/"/g,'').trim() : "See analysis above.";

      // Get dimension breakdown
      var dims = {};
      var dimTitles = document.querySelectorAll('[style*="B8964A"][style*="uppercase"]');
      dimTitles.forEach(function(el){
        var key = el.textContent.trim().toLowerCase();
        var next = el.nextElementSibling;
        if(next) dims[key] = next.textContent.trim();
      });
      dims.overall_fit = dims.overall_fit || "See full analysis in Command Center.";

      var payload = {
        name: name,
        date: new Date().toISOString().slice(0,10),
        roleLabel: "Field Technician",
        mode: "candidate",
        result: {
          verdict: verdict,
          confidence: confidence,
          hiring_recommendation: rec,
          strengths: strengths.length ? strengths : ["See full analysis in Command Center"],
          watch_areas: watchAreas.length ? watchAreas : ["See full analysis in Command Center"],
          craftsman_alignment: Object.keys(dims).length ? dims : {overall_fit: "See full analysis."},
          hero_alignment_scores: null
        }
      };

      try{
        localStorage.setItem('hero_scorecard_data', JSON.stringify(payload));
        window.location.href = '/scorecard.html';
      }catch(e){
        alert('Error saving data: ' + e.message);
      }
    });

    resultsDiv.appendChild(btn);
    console.log('H.E.R.O. scorecard button injected');
  }

  // Watch for DOM changes (React renders results dynamically)
  var observer = new MutationObserver(function(){
    injectButton();
  });
  
  observer.observe(document.body, {childList: true, subtree: true});
  
  // Also try on interval as backup
  setInterval(injectButton, 2000);
  
})();