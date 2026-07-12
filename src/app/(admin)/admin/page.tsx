import { AdminPageFrame } from "./layout";

export default function AdminHomePage() {
  return (
    <AdminPageFrame title="Обзор" currentPath="/admin">
      <div className="grid gap-4 font-sans text-secondary">
        <p>
          Структурированные редакторы для услуг, кейсов, FAQ, отзывов, контактов
          и медиа. Заявки доступны со статусами и CSV-экспортом.
        </p>
        <ul className="grid gap-2">
          <li>Сохранение только по явной кнопке «Сохранить»</li>
          <li>Reorder через клавиатуру и drag-and-drop</li>
          <li>Загрузка файлов в Timeweb S3 с прогрессом</li>
        </ul>
      </div>
    </AdminPageFrame>
  );
}
