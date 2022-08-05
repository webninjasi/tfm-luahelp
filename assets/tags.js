var colors = ["BL", "BV", "CE", "CEP", "CH", "CS", "G", "J", "N", "N2", "PT", "PS", "R", "ROSE", "S", "T", "V", "VP", "VI", "D", "O", "CH2", "FC"];

function refresh() {
  var sample = escapeHTML(document.getElementById('sample').value);
  var html = [
    '<span class="TI">&lt;TI&gt;' + sample + '<span class="CL">&lt;CL&gt;' + sample + '</span></span>',
    '<div class="TD">&lt;TD&gt;' + sample + '<div class="TG">&lt;TG&gt;' + sample + '</div></div>',
  ];

  for (var i = 0; i < colors.length; i ++) {
    html.push('<span class="' + colors[i] + '">&lt;' + colors[i] + '&gt;' + sample + '</span>');
  }

  html.push.apply(html, [
    '<a href="#">&lt;a href="event:eventName for eventTextAreaCallback"&gt;' + sample + '&lt;/a&gt;</a>',
    '<b>&lt;b&gt;' + sample + '&lt;/b&gt;</b>',
    '<i>&lt;i&gt;' + sample + '&lt;/i&gt;</i>',
    '<u>&lt;u&gt;' + sample + '&lt;/u&gt;</u>',
    '<span style="font-family:Arial;">&lt;font face="Arial"&gt;' + sample + '&lt;/font&gt;</span>',
    '<span style="color:#ff0000;">&lt;font color="#ff0000"&gt;' + sample + '&lt;/font&gt;</span>',
    '<span style="font-size:20px;">&lt;font size="20"&gt;' + sample + '&lt;/font&gt;</span>',
    sample.substr(0, sample.length / 2) + '\\n<br />' + sample.substr(sample.length / 2),
    sample.substr(0, sample.length / 2) + '\\t\t' + sample.substr(sample.length / 2),
    '<li>&lt;li&gt;' + sample + '&lt;/li&gt;</li>',
    '<p style="text-align:center;">&lt;p align="center"&gt;' + sample + '</p>',
    '<p style="text-align:right;">&lt;p align="right"&gt;' + sample + '</p>',
    '<p style="text-align:justify;">&lt;p align="justify"&gt;' + sample + '</p>',
    '<p style="text-align:left;">&lt;p align="left"&gt;' + sample + '</p>',
    '<span style="margin-left:10px;">&lt;textformat leftmargin="10"&gt;' + sample + '&lt;/textformat&gt;</span>',

    '<div style="line-height:0.6;">&lt;textformat leading="-8"&gt;' + sample.substr(0, sample.length / 2)
    + '\\n<br />' + sample.substr(sample.length / 2) + '&lt;/textformat&gt;</div>',
    
    '<div style="min-width:500px;display:inline-block;"><div style="min-width:250px;display:inline-block;">' +
    '&lt;textformat tabstops="[250,500]"&gt;<br />' + sample.substr(0, sample.length / 2)
    + '\\t</div>' + sample.substring(sample.length / 2, sample.length * 3 / 4) + '\\t</div>' + sample.substr(sample.length * 3 / 4) +
    '&lt;/textformat&gt;',
    ''
  ]);

  document.getElementById('content').innerHTML = html.join('<br /><br />');
}

document.getElementById('sample').addEventListener('keyup', function() {
  refresh();
});

refresh();
