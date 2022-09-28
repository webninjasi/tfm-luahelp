var colors = ["BL", "BV", "CE", "CEP", "CH", "CS", "G", "J", "N", "N2", "PT", "PS", "R", "ROSE", "S", "T", "V", "VP", "VI", "D", "O", "CH2", "FC"];

function refresh() {
  var sample = escapeHTML(document.getElementById('sample').value);
  var html = [
    '<thead>',
    '<tr><th>CODE</th><th>PREVIEW</th></tr>',
    '</thead>',
    '<tbody>',
    row(
      '&lt;TI&gt;' + sample + '&lt;CL&gt;' + sample,
      '<span class="TI">' + sample + '<span class="CL">' + sample + '</span></span>'
    ),
    row(
      '&lt;TD&gt;' + sample + '\\n&lt;TG&gt;' + sample,
      '<div class="TD">' + sample + '<div class="TG">' + sample + '</div></div>'
    ),
  ];

  for (var i = 0; i < colors.length; i ++) {
    html.push(
      row(
        '&lt;' + colors[i] + '&gt;' + sample,
        '<span class="' + colors[i] + '">' + sample + '</span>'
      )
    );
  }

  html.push.apply(html, [
    row(
      '&lt;a href="event:eventName for eventTextAreaCallback"&gt;' + sample + '&lt;/a&gt;',
      '<a href="#">' + sample + '</a>'
    ),
    row(
      '&lt;b&gt;' + sample + '&lt;/b&gt;',
      '<b>' + sample + '</b>'
    ),
    row(
      '&lt;i&gt;' + sample + '&lt;/i&gt;',
      '<i>' + sample + '</i>'
    ),
    row(
      '&lt;u&gt;' + sample + '&lt;/u&gt;',
      '<u>' + sample + '</u>'
    ),
    row(
      '&lt;font face="Arial"&gt;' + sample + '&lt;/font&gt;',
      '<span style="font-family:Arial;">' + sample + '</span>'
    ),
    row(
      '&lt;font color="#ff0000"&gt;' + sample + '&lt;/font&gt;',
      '<span style="color:#ff0000;">' + sample + '</span>'
    ),
    row(
      '&lt;font size="20"&gt;' + sample + '&lt;/font&gt;',
      '<span style="font-size:20px;">' + sample + '</span>'
    ),
    row(
      sample + '\\n' + sample,
      sample + '<br />' + sample
    ),
    row(
      sample + '\\t' + sample,
      sample + '\t' + sample
    ),
    row(
      '&lt;li&gt;' + sample + '&lt;/li&gt;',
      '<li>' + sample + '</li>'
    ),
    row(
      '&lt;p align="center"&gt;' + sample,
      '<p style="text-align:center;">' + sample + '</p>'
    ),
    row(
      '&lt;p align="right"&gt;' + sample,
      '<p style="text-align:right;">' + sample + '</p>'
    ),
    row(
      '&lt;p align="justify"&gt;' + sample,
      '<p style="text-align:justify;">' + sample + '</p>'
    ),
    row(
      '&lt;p align="left"&gt;' + sample,
      '<p style="text-align:left;">' + sample + '</p>'
    ),
    row(
      '&lt;textformat leftmargin="10"&gt;' + sample + '&lt;/textformat&gt;',
      '<span style="margin-left:10px;">' + sample + '</span>'
    ),

    row(
      '&lt;textformat leading="-8"&gt;' +
      sample + '\\n' + sample +
      '&lt;/textformat&gt;',
      '<div style="line-height:0.6;">' +
      sample + '<br />' + sample +
      '</div>'
    ),

    row(
      '&lt;textformat tabstops="[250,500]"&gt;' +
      sample +'\\t' + sample + '\\t' + sample +
      '&lt;/textformat&gt;',
      '<div style="min-width:500px;display:inline-block;">' +
      '<div style="min-width:250px;display:inline-block;">' +
      '<br />' +
      sample + '</div>' +
      sample + '</div>' +
      sample
    ),
  
    '</tbody>'
  ]);

  document.getElementById('tags-content').innerHTML = html.join('');
}

function row(left, right) {
  return '<tr>' + '<td>' + left + '</td>' + '<td>' + right + '</td>' + '</tr>';
}

document.getElementById('sample').addEventListener('keyup', function() {
  refresh();
});

refresh();
