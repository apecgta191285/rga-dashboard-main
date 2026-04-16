import { Controller, Post, Body } from '@nestjs/common';

@Controller('debug')
export class EchoController {
  @Post('echo')
  echo(@Body() body: any) {
    return {
      receivedBody: body,
      receivedType: typeof body,
      keys: Object.keys(body || {}),
    };
  }
}
