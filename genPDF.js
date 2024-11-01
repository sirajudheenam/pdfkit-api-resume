const PDFDocument = require('pdfkit');
const blobStream = require('blob-stream');
// create a document and pipe to a blob
var doc = new PDFDocument({ font: 'Courier' });
var stream = doc.pipe(blobStream());

const lorem = "Lorem ipsum dolor sit amet,consectetur adipiscing elit.Etiam in    suscipit purus.Vestibulum anteipsum primis in faucibus orci luctuset ultrices posuere cubilia Curae;Vivamus nec hendrerit felis.Morbialiquam facilisis risus eu lacinia.Sedeu leo in turpis fringilla hendrerit.Utnec accumsan nisl.Suspendisserhoncus nisl posuere tortor tempus etdapibus elit porta.Cras leo neque,    elementum a rhoncus ut, vestibulumnon nibh.Phasellus pretium justo;turpis.Etiam vulputate, odio vitaetincidunt ultricies, eros odio dapibus;nisi, ut tincidunt lacus arcu eu elit.Aenean velit erat, vehicula egetlacinia ut, dignissim non tellus.Aliquam nec lacus mi, sedvestibulum nunc.Suspendisse;potenti.Curabitur vitae sem turpis.Vestibulum sed neque eget dolordapibus porttitor at sit amet sem.Fusce a turpis lorem.Vestibulumante ipsum primis in faucibus orciluctus et ultrices posuere cubilia;Curae;Mauris at ante tellus.Vestibulum a metus lectus.Praesenttempor purus a lacus blandit egetgravida ante hendrerit.Cras et eros;metus.Sed commodo malesuada;eros, vitae interdum augue semper;quis.Fusce id magna nunc.Curabitur sollicitudin placerat;semper.Cras et mi neque, adignissim risus.Nulla venenatisporta lacus, vel rhoncus lectustempor vitae.Duis sagittis venenatis rutrum. Curabitur tempor massa…";

// draw some text
doc.fontSize(25).text('Here is some vector graphics...', 100, 80);

// some vector graphics
doc
    .save()
    .moveTo(100, 150)
    .lineTo(100, 250)
    .lineTo(200, 250)
    .fill('#FF3300');

doc.circle(280, 200, 50).fill('#6600FF');

// an SVG path
doc
    .scale(0.6)
    .translate(470, 130)
    .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
    .fill('red', 'even-odd')
    .restore();

// and some justified text wrapped into columns
doc
    .text('And here is some wrapped text...', 100, 300)
    .font('Times-Roman', 13)
    .moveDown()
    .text(lorem, {
        width: 412,
        align: 'justify',
        indent: 30,
        columns: 2,
        height: 300,
        ellipsis: true
    });

// end and display the document in the iframe to the right
doc.end();
stream.on('finish', function () {
    iframe.src = stream.toBlobURL('application/pdf');
});