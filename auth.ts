import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getConnection } from "@/lib/db";
import sql from "mssql";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 horas
    updateAge: 60 * 30, // refrescar cada 30 min de actividad
  },
  providers: [
    Credentials({
      credentials: {
        tipo: { label: "Tipo" },
        usuario: { label: "Usuario" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const tipo = typeof credentials?.tipo === "string" ? credentials.tipo : "";
        const usuario = typeof credentials?.usuario === "string" ? credentials.usuario : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!tipo || !usuario || !password) return null;

        try {
          const pool = await getConnection();
          const result = await pool
            .request()
            .input("clave", sql.VarChar, tipo)
            .input("trabajador", sql.VarChar, usuario)
            .input("password", sql.VarChar, password)
            .execute("sp_CA_BuscarUsuario");

          if (!result.recordset || result.recordset.length === 0) return null;
          if (result.recordset.length > 1) {
            console.warn(
              "[auth] sp_CA_BuscarUsuario devolvió múltiples filas para",
              usuario,
            );
          }

          const row = result.recordset[result.recordset.length - 1];

          if (row.intClvTipoUsuario == null) return null;
          if (String(row.intClvTipoUsuario) !== tipo) return null;

          return {
            id: usuario,
            name: row.Expr1 != null ? String(row.Expr1) : usuario,
            tipoUser: String(row.intClvTipoUsuario),
            chrCarrera: row.chrCarrera != null ? String(row.chrCarrera) : "",
            claveCA: row.vchClvCA != null ? String(row.vchClvCA) : "",
          };
        } catch (error) {
          console.error(
            "[auth] error en authorize:",
            error instanceof Error ? error.message : String(error),
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.tipoUser = (user as { tipoUser?: string }).tipoUser;
        token.chrCarrera = (user as { chrCarrera?: string }).chrCarrera;
        token.claveCA = (user as { claveCA?: string }).claveCA;
      }
      return token;
    },
    async session({ session, token }) {
      const u = session.user as Record<string, unknown>;
      u.id = token.sub;
      u.tipoUser = token.tipoUser;
      u.chrCarrera = token.chrCarrera;
      u.claveCA = token.claveCA;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
