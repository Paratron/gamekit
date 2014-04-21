conf:{
    "key": "layers-groups-sprites",
    "title": "Ebenen, Gruppen und Sprites"
}:conf

#Ebenen, Gruppen und Sprites

Diese Elemente sind die grundlegenden Elemente jedes Spiels oder Präsentation die du mit gamekit erstellst.


Ebenen
------
Ebenen ermöglichen es dir deine Spielelemente übereinander anzuordnen und Transparenz oder Sichtbarkeit für mehrere Sprites gleichzeitig festzulegen.
Ebenen sind den Gruppen ähnlich, mit dem Unterschied das sie selbst nicht bewegbar oder drehbar sind.


Gruppen
-------
Gruppen sind Container, welche für sich selbst nicht sichtbar gezeichnet werden (ausser im Debug-Zeichenmodus), allerdings viele Sprites oder andere Gruppen enthalten können, damit diese alle auf einmal bewegt, skaliert und rotiert werden können.

Gruppen haben einen Ursprungspunkt um welchen herum sie rotiert und skaliert werden können. Du kannst einen Transparenzwert (Alpha-Wert) für eine Gruppe setzen, um alle enthaltenen Kinder gemeinsam zu beeinflussen.

Merke dir, dass alle Eigenschaften der Elemente innerhalb einer Gruppe relativ zur Gruppe und ihrem Ursprungspunkt behandelt werden.

Gruppeneigenschaften können animiert werden. Sie verfügen über die gleichen Tween-Methoden wie das Sprite Objekt.
Beachte die Sprites Sektion weiter unten für weitere Informationen.


Sprites
-------
Sprites sind die Grundelemente jedes Spiels das du erstellst. Sprites rendern deine Grafiken auf den Bildschirm und können positioniert und modifiziert werden.
Sie bieten ebenfalls Funktionen für dauerhafte Bewegungen oder Animation von Eigenschaften.

Ein Sprite benötigt eine zuvor geladene Resourcendatei welche anhand der Eigenschaften des Sprites auf den
Bildschirm gezeichnet werden.


###Abmessungen
Du kannst die `w` und `h` Eigenschaft des Sprite setzen um zwei Effekte zu erzielen: wenn die `stretch` Eigenschaft
des Sprite auf false gesetzt ist (Standard) wird der Sprite abgeschnitten wenn du kleinere Abmessungen als die der zu zeichnenden Resource setzt.
Auf der anderen Seite wird der zusätzliche Bereich transparent dargestellt, wenn du die Eigenschaften größer als die Abmessung der zu zeichnenden
Resource setzt.
Wenn `stretch` auf true gesetzt ist, wird die Resource gezerrt um die Abmessungen des Sprites zu erfüllen. Beachte dass das Seitenverhältnis der Grafik
dabei nicht beibehalten wird.

Zusätzlich kannst du die Größe eines Sprites auch über die Eigenschaften `scaleX` und `scaleY` beeinflussen, ohne
seine tatsächlichen Abmessungen zu verändern. Der Skalierungsfaktor ist standardmäßig auf `1` gesetzt - dies bedeutet
100% der Abmessungen. Setze ihn auf `0.5` um 50%, oder `2`, um doppelte Größe zu erhalten.

Beachte das Skalierung relativ zum Ursprungspunkt des Sprites geschieht. Mehr Information über den Urpsungspunkt, unten.

###Position
Sprites orientieren sich an ihrem Ursprungspunkt. Wenn du die `x` und `y` Eigenschaften eines Sprite setzt, ist
es eigentlich der Ursprungspunkt, welcher an diesen Koordinaten platziert wird. Wenn du die `originX` oder `originY`
Eigenschaft des Sprites größer 0 setzt, wird die Sprite Grafik mehr und mehr nach oben links versetzt. Wenn dein
Ursprungspunkt auf `0,0` gesetzt ist, wird der Punkt in der oberen linken Ecke der Grafik platziert. Die Grafikposition
stimmt dann mit der `x` und `y` Eigenschaft des Sprite überein. Allerdings wirst du feststellen das der Sprite dann
auch um seine linke, obere Ecke rotiert, wenn du eine Rotation für ihn setzt, da ein Sprite um seinen Ursprungspunkt
herum rotiert wird.

Du kannst den Ursprungspunkt eines Sprite jederzeit ändern. Allerdings bewirkt eine Änderung der `originX` und `originY`
Eigenschaften eines Sprite während es auf dem Bildschirm dargestellt wird eine Veränderung der visuellen Position.
Dies liegt daran, dass die Grafik immer relativ zur tatsächlichen `x` und `y` Koordinate gezeichnet wird.

Um dich zu untersützen, bietet dir das Sprite Objekt zwei Methoden: `Sprite.changeOrigin()` und `Sprite.centerOrigin()`.
Beide Methoden erhalten die visuelle Position des Sprite auf dem Bildschirm, indem sie die `x` und `y` Eigenschaften relativ
zum neuen Ursprungspunkt anpassen, damit das Objekt an Ort und Stelle bleibt.

`Sprite.centerOrigin()` setzt den Ursprungspunkt auf den Mittelpunkt der Bildresource, damit du diesen nicht selbst kalkulieren musst.
Ich nutze diese Methode oft direkt nach der Erstellung eines Sprite, denn ich möchte meistens, das sich meine Sprites um
ihren Mittelpunkt drehen.

