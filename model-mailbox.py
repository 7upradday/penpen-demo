import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.8):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 m.node_tree.nodes.clear();p=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled');out=m.node_tree.nodes.new('ShaderNodeOutputMaterial');m.node_tree.links.new(p.outputs[0],out.inputs[0]);p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough
 return m
red=mat('Vermilion felt',(.72,.009,.012)); dark=mat('Deep red recess',(.12,.004,.006)); white=mat('Ivory felt',(.94,.87,.74)); gray=mat('Penguin charcoal',(.07,.075,.075)); ink=mat('Black glass',(.018,.014,.01),.23); orange=mat('Tangerine',(.96,.26,.016))
def finish(o,name,m):
 o.name=name;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def box(name,loc,size,m,r=.07):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if r:
  mod=o.modifiers.new('Soft edges','BEVEL');mod.width=r;mod.segments=5;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return finish(o,name,m)
def egg(name,loc,size,m,rot=0):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=28,location=loc);o=bpy.context.object;o.scale=size;o.rotation_euler[1]=rot;return finish(o,name,m)
def line(name,pts,m,width=.025):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=width;c.bevel_resolution=4;s=c.splines.new('POLY');s.points.add(len(pts)-1)
 for p,v in zip(s.points,pts):p.co=(*v,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
box('Pedestal',(0,0,.18),(2.04,1.32,.30),red,.12)
box('Post',(0,.08,.53),(.85,.65,.60),red,.06)
for x in [-.82,.82]:egg('Base rivet',(x,-.4,.35),(.035,.035,.05),red)
# Extruded rounded bear-ear silhouette. Front is -Y.
control=[(-1.12,.82),(-1.16,1.3),(-1.16,2.45),(-1.29,2.80),(-1.22,3.15),(-.98,3.34),(-.70,3.32),(-.39,3.16),(.39,3.16),(.70,3.32),(.98,3.34),(1.22,3.15),(1.29,2.80),(1.16,2.45),(1.16,1.3),(1.12,.82)]
pts=[]
for i in range(len(control)):
 p0=Vector(control[(i-1)%len(control)]);p1=Vector(control[i]);p2=Vector(control[(i+1)%len(control)]);p3=Vector(control[(i+2)%len(control)])
 for k in range(8):
  t=k/8;v=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);pts.append(tuple(v))
n=len(pts);verts=[(x,y,z) for y in [-.5,.5] for x,z in pts]
faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
mesh=bpy.data.meshes.new('Mailbox shell');mesh.from_pydata(verts,[],faces);mesh.update();body=bpy.data.objects.new('Mailbox',mesh);bpy.context.collection.objects.link(body);finish(body,'Mailbox',red)
bpy.context.view_layer.objects.active=body;body.select_set(True)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
bevel=body.modifiers.new('Rounded shell','BEVEL');bevel.width=.065;bevel.segments=4;bpy.ops.object.modifier_apply(modifier=bevel.name)
cutter=box('Slot cutter',(0,-.48,2.73),(1.39,.5,.105),dark,.02)
bpy.context.view_layer.objects.active=body;mod=body.modifiers.new('Real letter opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
body.modifiers.new('Flat front weighted normals','WEIGHTED_NORMAL')
for poly in body.data.polygons:
 if abs(poly.normal.y)>.98:poly.use_smooth=False
uv=body.data.uv_layers.new(name='Felt grain')
for loop in body.data.loops:
 co=body.data.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(co.x/2.6+.5,co.z/3.4)
box('Dark inside slot',(0,-.27,2.73),(1.38,.05,.10),dark,.01)
box('Slot upper lip',(0,-.565,2.815),(1.46,.16,.09),red,.025)
for x in [-.46,.46]:
 line('Smiling eye',[(x+.11*math.cos(t),-.565,2.29+.06*math.sin(t)) for t in [i*math.pi/15 for i in range(16)]],ink,.032)
bpy.ops.mesh.primitive_torus_add(major_radius=.088,minor_radius=.027,major_segments=40,minor_segments=12,location=(0,-.57,2.08),rotation=(math.pi/2,0,0));finish(bpy.context.object,'Round mouth',ink)
def envelope(name,x,y,z,w,h):
 box(name,(x,y,z),(w,.052,h),white,.028)
 line(name+' flap',[(x-w*.46,y-.032,z+h*.41),(x,y-.039,z-h*.12),(x+w*.46,y-.032,z+h*.41)],red,.012)
envelope('Front envelope',0,-.56,1.46,1.40,.77)
envelope('Side stamp',-1.18,.05,1.5,.06,.42)
# Penguin: body, heart-like ivory face, oval flippers and a held envelope.
egg('Penguin body',(0,.02,3.80),(.52,.40,.64),gray)
egg('Penguin head',(0,.02,4.14),(.46,.37,.47),gray)
egg('Penguin belly',(0,-.305,3.77),(.365,.13,.43),white)
for x in [-.19,.19]:egg('Ivory cheek',(x,-.285,4.15),(.225,.145,.32),white)
for x in [-.205,.205]:
 egg('Eye',(x,-.424,4.205),(.038,.022,.049),ink)
 egg('Eye light',(x-.009,-.445,4.22),(.009,.004,.011),white)
egg('Beak',(0,-.446,4.075),(.095,.075,.050),orange)
for x in [-.27,.27]:egg('Orange foot',(x,-.23,3.30),(.14,.20,.10),orange)
envelope('Held letter',0,-.46,3.77,.59,.41)
for x,rot in [(-.40,-.32),(.40,.32)]:egg('Flipper',(x,-.34,3.80),(.145,.15,.27),gray,rot)
# Keep a camera and lights in the editable Blender file.
bpy.ops.object.camera_add(location=(6,-12,6));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,2.4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=6;bpy.context.scene.camera=cam
for pos,power,size in [((-4,-6,9),1100,6),((5,-2,6),650,5)]:
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
os.makedirs(os.path.join(ROOT,'assets/models'),exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'assets/models/mailbox.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'assets/models/mailbox.glb'),export_format='GLB',export_cameras=False,export_lights=False)
