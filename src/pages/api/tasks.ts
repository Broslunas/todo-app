import { MongoClient, ObjectId } from "mongodb";
import { config } from "dotenv";

config();

const MONGO_URI = process.env.MONGO_URI || "";
if (!MONGO_URI) {
  throw new Error("MONGO_URI es not defined in the environment variables.");
}

const client = new MongoClient(MONGO_URI);

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const { username, title, description = "", tags } = await request.json(); // Descripción opcional con valor predeterminado

    if (!username || !title) {
      // Solo validar username y title como obligatorios
      return new Response(
        JSON.stringify({ response: "Faltan campos obligatorios." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await client.connect();
    const db = client.db("broslunas");
    const collectionName = `${username}-list`;
    const tasksCollection = db.collection(collectionName);

    const creationDate = new Date().toISOString();

    const result = await tasksCollection.insertOne({
      title,
      description, // Guardar la descripción, incluso si está vacía
      tags: Array.isArray(tags) ? tags.filter((tag) => tag.trim() !== "") : [], // Filtrar valores vacíos
      creationDate,
    });

    if (result.acknowledged) {
      return new Response(
        JSON.stringify({ response: "Tarea creada con éxito." }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ response: "Error al crear la tarea." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al crear la tarea:", error);
    return new Response(
      JSON.stringify({ response: "Error interno del servidor." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.close();
  }
}

export async function GET({ request }: { request: Request }) {
  try {
    const username = request.headers.get("username");

    if (!username) {
      return new Response(
        JSON.stringify({ response: "Usuario no especificado." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await client.connect();
    const db = client.db("broslunas");
    const collectionName = `${username}-list`;
    const tasksCollection = db.collection(collectionName);

    const tasks = await tasksCollection.find().toArray();

    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener las tareas:", error);
    return new Response(
      JSON.stringify({ response: "Error interno del servidor." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.close();
  }
}

export async function PATCH({ request }: { request: Request }) {
  try {
    const { username, taskId, complete } = await request.json();

    if (!username || !taskId || typeof complete !== "boolean") {
      return new Response(
        JSON.stringify({
          response: "Faltan campos obligatorios o el estado es inválido.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await client.connect();
    const db = client.db("broslunas");
    const collectionName = `${username}-list`;
    const tasksCollection = db.collection(collectionName);

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { complete } }
    );

    if (result.modifiedCount > 0) {
      return new Response(
        JSON.stringify({
          response: "Estado de la tarea actualizado con éxito.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ response: "No se encontró la tarea." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al actualizar la tarea:", error);
    return new Response(
      JSON.stringify({ response: "Error interno del servidor." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.close();
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    const { username, taskId } = await request.json();

    if (!username || !taskId) {
      return new Response(
        JSON.stringify({ response: "Faltan campos obligatorios." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await client.connect();
    const db = client.db("broslunas");
    const collectionName = `${username}-list`;
    const tasksCollection = db.collection(collectionName);

    const result = await tasksCollection.deleteOne({
      _id: new ObjectId(taskId),
    });

    if (result.deletedCount > 0) {
      return new Response(
        JSON.stringify({ response: "Tarea eliminada con éxito." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ response: "No se encontró la tarea." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al eliminar la tarea:", error);
    return new Response(
      JSON.stringify({ response: "Error interno del servidor." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.close();
  }
}

export default {
  POST,
  GET,
  PATCH,
  DELETE,
};
