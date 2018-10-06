const ids = {};

const drawEvents = showList => {
    showList.reverse();

    showList.forEach(e => {
      const properties = [e.id, e.type];
      if (e.action) properties.push(e.action);
      if (e.branch) properties.push(`branch: ${e.branch}`);
      if (e.head) properties.push(`head: ${e.head}`);
      if (e.base) properties.push(`base: ${e.base}`);
      if (e.message) properties.push(`${e.message}`);
      properties.push(e.user, e.created, '*******');

      $('#lines').prepend(
        `<li>
          <ul>
            ${properties.map(prop => `<li>${prop}</li>`).join('')}
          </ul>
        </li>`);  
    });
  
};

const storeNewEvents = events => {
  return events.map(ev => {
    if (!ids[ev.id]) {
      ids[ev.id] = true;
      return ev;
    }
  }).filter(x => x);
};

const refreshEvents = () => {
  $.getJSON('/events', null, data => {
    const show = storeNewEvents(data);
    drawEvents(show); 
  }).fail(function(e) {
    console.error(e);
  });
}; 

$(() => {
  $('#refresh').click(() => setInterval(refreshEvents, 3000));
});