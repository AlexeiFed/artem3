import {
  buildYandexVerificationHtmlFile,
  isYandexVerificationToken,
} from "./yandex-verification";

interface YandexVerificationFileHandlerDependencies {
  loadVerificationContent(): Promise<string>;
}

export function createYandexVerificationFileHandler({
  loadVerificationContent,
}: YandexVerificationFileHandlerDependencies): (
  request: Request,
  context: { params: Promise<{ code: string }> },
) => Promise<Response> {
  return async function handleYandexVerificationFile(
    _request: Request,
    context: { params: Promise<{ code: string }> },
  ): Promise<Response> {
    const { code } = await context.params;
    if (!isYandexVerificationToken(code)) {
      return new Response(null, { status: 404 });
    }

    const stored = await loadVerificationContent();
    if (!stored || stored !== code) {
      return new Response(null, {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return new Response(buildYandexVerificationHtmlFile(code), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  };
}
