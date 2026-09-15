(function(){
  const SUPER_MATCHES=[['Galatasaray','Kocaelispor'],['Trabzonspor','Galatasaray'],['Samsunspor','Trabzonspor']],CL_HOME='Manchester City',CL_AWAY='PSG',NL1_HOME='Türkiye',NL1_AWAY='Fransa',NL2_HOME='Türkiye',NL2_AWAY='İtalya';
  function badge(){return '<span class="opp-badge">X2</span>'}
  function mountStyles(){if(document.getElementById('oppStyles'))return;document.head.insertAdjacentHTML('afterbegin',`<style id="oppStyles">.