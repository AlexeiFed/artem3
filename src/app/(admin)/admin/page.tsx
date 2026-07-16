import { AdminPageFrame } from "./layout";

export default function AdminHomePage() {
  return (
    <AdminPageFrame title="Обзор" currentPath="/admin">
      <div className="grid gap-4 font-sans text-secondary">
        <p>
          Структурированные редакторы для услуг, кейсов, FAQ, отзывов, контактов,
          правовых текстов и медиа. Заявки и согласия — со статусами и CSV.
        </p>
        <ul className="grid gap-2">
          <li>Сохранение только по явной кнопке «Сохранить»</li>
          <li>Reorder через клавиатуру и drag-and-drop</li>
          <li>
            Медиа: локально в <code>public/media/uploads</code> (
            <code>MEDIA_DRIVER=local</code>)
          </li>
        </ul>
      </div>
    </AdminPageFrame>
  );
}
