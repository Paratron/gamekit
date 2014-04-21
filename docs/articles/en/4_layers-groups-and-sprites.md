conf:{
    "key": "layers-groups-sprites",
    "title": "Layers, Groups and Sprites"
}:conf

#Layers, Groups and Sprites

This elements are the base parts of every game or presentation you build with gamekit.


Layers
------
Layers enable you to align your game elements on top of eachother and set alpha-blending or visibility for a number of sprites together. Layers are a bit like groups, with the difference that they can't be moved or rotated themselves.

Groups
------
Groups are containers that are not visually displayed themselves (except in debug rendering mode), but can contain numerous sprites or other groups so they can be moved, scaled and rotated all together.

Groups can have a origin point set to be rotated and scaled around. You can set a alpha value for a group to affect all children inside it alltogether.

Keep in mind that all properties of elements inside the group are threated relatively to the groups origin point and properties.

Groups can be animated. They share the Tween methods from the Sprite Object. See the Sprites section below for more information.

Sprites
-------
Sprites are the base elements of every game you create. Sprites render your graphics on the screen and can be positioned and modified. They also offer functionality for continuous movement or property animation.

A Sprite needs to get a previously loaded asset file assigned which will be rendered on the screen according to the sprites properties. 

###Dimensions
You can set the `w` and `h` property of the sprite to achieve two effects: If the `stretch` property of the sprite is set to false (default), the sprite will be cut off, when you set smaller dimensions than the assets size. On the other hand, if you set the  properties bigger than the assets size, the additional space will remain transparent. When `stretch` is set to true, the asset will be stretched to fit the sprites dimensions. Note that aspect ratio won't be respected.

If you want, you can also use the Sprites `scaleX` and `scaleY` properties to affect the size of a Sprite without changing its actual dimensions. A scale factor is by default set to `1` - that means 100% of the dimension. Set it to `0.5` to get 50% or `2` for twice the size - you get the point.

Note that scaling happens relative to the Sprites origin point (more information about the origin point below).

###Position

Sprites are oriented at their origin point. If you set the `x` and `y` properties of a Sprite, its actually the origin point of the Sprite that will end up on that position. If you set the Sprites `originX` or `originY` properties higher than 0, the Sprites image will be placed more and more to the upper left. If your origin point is set to `0,0`, the point is placed at the upper left corner of your asset image. The images position will then equal the Sprites `x` and `y` property. However, if you try to rotate the Sprite, you will see that it rotates around the upper left corner, because Sprites rotate around their origin point.

You can change a Sprites origin point at any time. However, changing the a Sprites `originX` or `originY` properties while its displayed on screen, you will make the object change its visual position. Thats because the asset will be rendered relatively to the actual `x` and `y` coordinates.

To help you out, the Sprite Object offers you two methods: `Sprite.changeOrigin()` and `Sprite.centerOrigin()`.    
Both methods preserve the Sprites visual position on screen by shifting the `x` and `y` properties relative to the new origin point, so the object remains in place.

`Sprite.centerOrigin()` will also place the origin point at the center of the asset image so you don't have to calculate it by yourself. I often call this method directly after the Sprite creation because I mostly want my Sprites to be rotated around their center.

