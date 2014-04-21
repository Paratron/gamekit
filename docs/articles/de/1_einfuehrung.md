conf:{
    "key": "getting-started",
    "title": "Einführung"
}:conf

Einführung
==========

Zuerst musst du dir eine Kopie von gamekit [von GitHub herunterladen](https://github.com/Paratron/gamekit/tree/master/dist).

Gamekit arbeitet innerhalb eines oder mehrerer Canvas Elemente in einem HTML Dokument. Diese Beispiel HTML
Struktur genügt bereits als Basis für ein gamekit Spiel:

    <!DOCTYPE html>
    <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
            <title>Eine gamekit Instanz</title>
        </head>
        <body>
            <canvas width="800" height="600></canvas>
            <script src="gamekit.js"></script>
        </body>
    </html>

Das ist nicht viel, oder? Wir müssen nichtmal die Canvas Größe im HTML Dokument definieren. Dies ist
ebenso innerhalb von gamekit's Einrichtungsroutine möglich.

Du wirst dich vielleicht fragen: okay, dort ist ein Canvas Element und ich kann erkennen, dass die gamekit
Bibliothek geladen wird. Aber wo ist die Spiellogik?
Ich habe mich dafür entschieden im HTML-Code selbst so wenig Spuren wie möglich zu hinterlassen - zum Einen
weil ich Einstiegs-Cheater damit verwirren kann, welche sich von einem schnellen Blick in den HTML-Code erhoffen
damit beim Spiel zu schummeln, andererseits aber auch weil ich gern ein Einheits-Template haben wollte, das ich
jederzeit in einen leeren Ordner kopieren kann um ein neues Spiel zu beginnen. Ich muss mir auch nicht sehr
viel merken um mit der grundlegenden Einrichtung zurecht zu kommen.

Du musst nur wissen: gamekit lädt sofort ein Modul namens "main" nachdem die Bibliothek geladen wurde - und hier
passiert auch die Einrichtngs-Magie.


Das Hauptmodul
--------------
Wenn du etwas mehr in die Details gehen möchtest, habe ich einen separaten [Artikel über Module](module) vorbereitet.

Nachdem die Bibliothek in den Browser geladen wurde, versucht sie automatisch das Modul "main" aus dem Modul-Ordner
zu laden. Das ist standardmäßig die Datei `/lib/game/main.js`.

Hier ist ein Beispiel, wie solch ein Hauptmodul von Innen aussehen kann:

    gamekit.defineModule('main', function(){

        //Sprites erstellen, alles ausrichten und zum Abrocken vorbereiten!
        function gameSetup(){
            //...
        }

        //Resourcen laden, dann das Spiel vorbereiten, danach die Engine starten.
        gamekit
            .fetchAssets('level1.assets.json')
            .then(gameSetup)
            .then(gamekit.start);

    });

Wie du sehen kannst ist der Einrichtungsprozess sehr einfach gehalten. Ich habe eine Einrichtungsroutine definiert,
welche aufgerufen wird nachdem meine Resourcen geladen wurden (Resourcen-Dateien werden in einer externen JSON
Datei definiert, damit ich sie ohne Änderungen am Code anpassen kann). Nachdem die Einrichtungsroutine fertig ist,
ruft gamekit seine start Methode auf.

Dank der eingebauten Javascript Promises/A Funktion kannst du asynchrone Methoden miteinander verketten und so
die jeweils nächste Methode ausführen, wenn der vorherige Teil der Kette bereit ist.

Mein Beispiel hier mag ein bisschen dümmlich sein, da ich direkt das erste Level lade und den Spieler ins Spiel
werfe, aber du könntest genauso gut die Resourcen für dein Hauptmenü laden und dieses anzeigen.