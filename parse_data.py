import csv
import uuid

# The raw text data
raw_data = """Salud y Bienestar (Personal)	Tecnología y Desarrollo (Software/IA)	Reformas y Construcción (Interior)	Obras y Estructuras (Exteriores)	Jardinería y Huerto (Plantas)	Mantenimiento y Reparaciones (Hogar/Taller)	Organización y Limpieza (Hogar)	Proyectos con Madera (Diseño)	Vehículos (Coche/Furgoneta)	Asuntos Financieros (Trámites)	Bebé (Maria)	Mascotas (Tortuga)	Asuntos Familiares (Padres)	Rol y Ocio (Específico)	Adquisiciones (Compras)	Mantenimiento y Acondicionamiento (Terreno/Exterior)	Alimentos (Conservas)	Bodas (Celebraciones)	Emprendimiento (Negocios)	Varios (Otros Aprendizajes)
Dejar de fumar 	Conseguir un teletrabajo: Echar curriculums 	Construir la ducha del cuarto de baño 	Construir pergola madera solar con diseños 3D realizado 	Plantar semilleros 	Restaurar Puerta Principal 	Poner 2 mas lavadoras 	Construir pergola madera solar con diseños 3D realizado 	Camperizar furgoneta de Carmen 	Indagar subvenciones negocio y casa 	Preparar cosas Maria. Muy importante 	Mejorar condiciones tortuga 	Ayudar con tareas de casa de mis padres 	Mejorar mi personaje del Rol 	Gestionar compra nevera 	Proveer leña, ir a por viñas y otros 	Crear huerta en fuente cercana 	Viajar con Sabrina 	Organizar y ejecutar planificación para implantación del ERP Odoo 17 de Carmen 	Aprender Ingles
Usar la CPAP todas las noches 	Crear librerías Angular (redimensionables) 	Fabricar taburetes para la taza del váter 	Construir Invernadero de 3x8 con plásticos y tubos 	Plantar lentisco línea cerca Invernadero 	Restaurar Puerta cocina 	Recoger y poner lavavajillas diariamente 	Fabricar maceteros autorriego con Sabrina 	Limpiar mi coche y reparaciones varias 	Revisar multas 	Construir valla zona segura para Maria 	Limpiar estanque tortuga 	Ordenar cosas almacenadas en casa de mis padres 	Asistir a algún evento de Rol 	Comprar una placa solar para pérgola solar 	Poner 2 sombras patio cocina 	Hacer conservas de aceitunas 	Planear fecha para la boda 	Pensar en proyecto empresa Infomoto e infovalle 	Fabricar placas pladur de cartón y polietileno
Sacar cita para la revisión del CPAP 	Desarrollar agente autónomo de IA (clawbot) 	Remates azulejos cuarto de baño 	Construir entrada a patio cocina con pilares de madera y puerta de hierro 	Plantar florecitas línea camino 	Instalar filtro de agua para beber 	Ordenar taller 	Hacer adorno de cabeza de cabra 	Comprar Aceite motosierra 	Revisar IMV 	Motar cuna Maria 	Sistema de reciclado de agua con bomba estanque tortuga 	Tratar humedades de casa de mis padres 	Planear reunión desarrollo web Rol 	Comprar Portatil 	Poner tierra para adelfas y construir ribazo de piedra 	Ir a por naranjas a Murcia 	Planear la celebración de boda 		Salir de fiesta y Jugar a juegos de mesa con mi hermana Carmen
Planificar zonas ejercicios y acondicionadas para practicar yoga 	Continuar con formación en desarrollo IA 	Instalación agua lavamanos cuarto de baño 	Cementar patio cocina 	Ir a por adelfas 	Arreglar esquina casa con canal 	Organizar mi ropa 		Componer cajas emergencia para los coches 	Revisar negocio autónomo IT 	Organizar ropa Maria 	Mejorar alimentación tortuga 	Reparar invernadero de mi padre 	Organizar cosas del rol en aspe 	Comprar aire acondicionado 	Huerta secano, adecuar sitio 	Hacer conserva de naranjas 	Firmar los papeles de boda 		Colgar las casetas murciélagos
Pedir cita médica para almorranas 	Reparar repetidor de cobertura móvil 	Lavamanos cuarto de baño 	Construir ribazo línea camino 	Plantar adelfas 	Arreglo del canal del porche de la lavadora 	Ordenar cables y cosas PC. Puesto múltiple de carga USB 		Limpiar coche Sabrina 	Pagar electricista Requena 	Preguntas para matrona, pañales tela y perilla mocos 		Viernes llevar mamá al médico 	Construir almacén para cosas el rol en aspe 	Comprar calzado para trabajar 	Canalización agua ducha externa para huerta 	Procesar almendras 	Celebrar mi cumpleaños 		Evaluar entretecho
Revisar cita operación nariz 	Configurar red y VPN ferretería Carmen 	Toallero electrico 	Construir ducha externa verano de obra 	Plantar membrillo , 	Arreglar la luz del taller 	Organizar especias 							Organizar cosas del rol en casa 	Comprarme ropa nueva 	Instalar una toma de agua en la parte de delante de la casa 	Cocinar cosas ricas para mi amor 			Utilizar agua para la cisterna reciclada
Diseñar y ejecutar plan de entrenamiento 	Organización de mensajes y correos 	Restaurar ventana habitación 	Construir potabilizadora de aguas grises 	Plantar viñas 	Arreglar la impresora D 	Organizar mueble despensa 							Terminar reglas personaje rol Sangre negra 	Comprar alcachofa grifo cocina 	Instalar una toma de luz para la motosierra en el lateral de la casa 	Ocuparme del compost 			Conducir aguas grises para la purificadora
Ir a la Peluquería 	Organizar proyectos GitHub 	Restaurar suelo habitación 	Arreglar techo de hierros pintar y enlucir 	Plantar pepinos y otras cosas con Sabrina 	Arreglar goteras del taller 	Hacer estanterias despensa 							Colaborar con proyecto de rol 		Acondicionar zona para orquídeas parte trasera taller 				Quitarme las faltas de ortografía
	Crear portafolios propio 	Restaurar pared y techo habitación 	Construir balsa riego 	Plantar chumberas a lo largo del camino 	Mejorar cuadro eléctrico 	Limpiar fogones 									Arreglar tumbonas 				Aprender algo de Ucraniano
	Instalar máquinas virtuales oracle 	Pintar habitación 	Construir fuente trasera 	Plantar pinos a lo largo del camino 	Pensar en la iluminación de la parte delantera casa 	Poner cubos para separar basura reciclaje 									Quitar raíz camino 				Retomar relación con ana y edu de Alcoy
	Comprar maquinas oracle Carmen 	Arreglar humedades en la escalera y pintar 	Construir muro contención tierra detrás de casa 	Enraizar esquejes lentisco 	Luces cama y mesita 										Acondicionar hueco nevera, agrandar y separar espacio 				Retomar relación con amigos de albacete
	Crear página web Carmen 	Acondicionar desván fantasma, suelo y pared 	Arreglar techo horno de leña 	Regar esquejes lentisco 	Poner toma de luz cafetera 										Instalar placas en Pergola 				Fabricar trampas para las avispas
	Formarse en IA 	Cementar suelo encima del aljibe 		Injertos pistacho 	Arreglar enrollador eléctrico 										Poner maceteros ventanas frontal casa
		Buscar puerta para horno de leña en la cocina 		Comprar pistachos y plantarlos 	Reparar aspiradora Carmen 										Pintar fachada de casa
		Chimenea cocina conectar con horno 		Comprar guindos y plantarlos 	Poner red y WIFI en casa 										Nivelar zona pinar
		Arreglar viga del salón 		Comprar cerezos y plantarlos 	Pensar en una solución para la luz en la entrada de la casa 										Acondicionar zona entrada camino nivelando, tapando ceniza y otros
		Arreglar Techo del salón 		Poner maceteros ventana y plantar flores 											Instalar toma de luz zona pinares
		Acondicionar espacio de la estufa 		Plantar ciruelos en la fuente 											Fabricar soporte manguera
		Poner y fijar tubo estufa 													Recoger poda
		Tapar secciones del tubo de la estufa y abrir arriba 													Arreglar poda
		Buscar rejilla seguridad estufa 													Arreglar jardineras enfrente de casa
		Buscar nuevo fregadero para la cocina 													Poner canal recogida aguas pluviales
		Buscar nueva encimera para la cocina 													Acondicionar zonas para recogida aguas pluviales
		Comprar un espejo para el salón 													Triturar acolchado
		Fabricar y comprar espejos habitación invitados 													Probar trituradora de ramas para poliestireno
		Abrir paso entre casa y taller 													Mantenimiento de mesa redonda de madera blanca
		Aislar techo buhardilla 													Restaurar mesa pinares
		Fabricar mesa plegable para el salón 													Arreglar sombrilla naranja
		Poner ventana ático en la habitación
		Poner ventana atico estudio
		Poner luz salón a instalación
		Mejorar mueble cocina
"""

lines = raw_data.strip().split('\n')
headers = [h.strip() for h in lines[0].split('\t')]
# Filter empty headers just in case
# Actually they are categories
categories = headers
data_rows = []
for line in lines[1:]:
    # Some lines have trailing spaces or tabs, we need to split by \t but preserve columns
    cols = [col.strip() for col in line.split('\t')]
    data_rows.append(cols)

# We will write Id, Type, ParentId, Name, Order, Completed, Counter, Percentage, Note, Deleted
output = []
cat_ids = {}

# Generate categories first
for i, cat in enumerate(categories):
    if not cat:
        continue
    cat_id = str(uuid.uuid4())
    cat_ids[cat] = cat_id
    output.append({
        'Id': cat_id,
        'Type': 'category',
        'ParentId': '',
        'Name': cat,
        'Order': i,
        'Completed': False,
        'Counter': 0,
        'Percentage': 0,
        'Note': '',
        'Deleted': False
    })

# Read tasks column by column
for col_idx, cat in enumerate(categories):
    if not cat:
        continue

    parent_id = cat_ids[cat]
    task_order = 0
    for row in data_rows:
        if col_idx < len(row):
            task_name = row[col_idx]
            if task_name:
                task_id = str(uuid.uuid4())
                output.append({
                    'Id': task_id,
                    'Type': 'task',
                    'ParentId': parent_id,
                    'Name': task_name,
                    'Order': task_order,
                    'Completed': False,
                    'Counter': 0,
                    'Percentage': 0,
                    'Note': '',
                    'Deleted': False
                })
                task_order += 1

with open('datos.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['Id', 'Type', 'ParentId', 'Name', 'Order', 'Completed', 'Counter', 'Percentage', 'Note', 'Deleted'])
    writer.writeheader()
    for row in output:
        writer.writerow(row)

print("datos.csv has been created.")
